const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connections = require("./models/connections");
const User = require("./models/User");
const dotenv = require("dotenv");
dotenv.config();
const salt = Number(process.env.SALT);
const secret = process.env.SECRET;

exports.getAllRequests = async (req, res) => {
  try {
    const allrequests = await connections.find();
    res.status(200).json(allrequests);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.pushRequest = async (req, res) => {
  try {
    const { name, url, listName, connectionNote } = req.body;
    if (!name || !url) {
      return res
        .status(400)
        .json({ message: "'name', 'url' and 'listName' fields are required" });
    }
    const userGuid = req.user.userGuid;
    // console.log(userGuid);
    const conn = new connections({
      name,
      url,
      listName,
      connectionNote,
      userGuid,
    });
    await conn.save();
    res.status(201).json({ message: "Connection saved successfully " });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const hashedPass = await bcrypt.hash(password, salt);

    const user = new User({ email, username, password: hashedPass });
    await user.save();
    res.status(201).json({ success: true, message: "User created", user });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { userId: user._id, userName: user.username, userGuid: user.guid },
        secret
      );
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.validateToken = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.json({
        valid: false,
        error: "Authorization header is missing",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.json({ valid: false, error: "Token is missing" });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.json({ valid: false, error: err.message });
      }
      res.json({ valid: true, decoded });
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const userGuid = req.user.userGuid;
    const requests = await connections.find({ userGuid });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.checkListName = async (req, res) => {
  try {
    const userGuid = req.user.userGuid;
    const listName = req.body.listName;
    if (!listName) {
      return res.status(400).json({ message: "ListName is required" });
    }
    const list = await connections.findOne({ userGuid, listName });
    if (list) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.getfromListName = async (req, res) => {
  try {
    const { listName } = req.body;
    const { userGuid } = req.user;
    console.log(userGuid);
    if (!listName) {
      return res.status(400).json({ message: "ListName is required" });
    }
    const list = await connections.find({ userGuid, listName });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConnectionsCount = async (req, res) => {
  try {
    const userGuid = req.user.userGuid;
    const count = await connections.countDocuments({ userGuid });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGroupedConnections = async (req, res) => {
  try {
    const userGuid = req.user.userGuid;
    const groupedConnections = await connections.aggregate([
      { $match: { userGuid } },
      {
        $group: {
          _id: "$listName",
          connections: {
            $push: {
              name: "$name",
              url: "$url",
              connectionNote: "$connectionNote",
              timestamp: "$timestamp",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json(groupedConnections);
  } catch (error) {
    res.status(500).json(err.message);
  }
};
