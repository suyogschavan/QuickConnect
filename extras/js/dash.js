document.addEventListener('DOMContentLoaded', async function() {
  const profileButton = document.getElementById('profile-button');
  const profileDropdown = document.getElementById('profile-dropdown');
  const searchBar = document.getElementById('search-bar');
  const connectionCounter = document.getElementById('connection-counter');
  const connectionsContainer = document.getElementById('connections-container');

  profileButton.addEventListener('click', () => {
    profileDropdown.classList.toggle('hidden');
  });
  chrome.storage.local.get(["authToken"], async (result) => {
    if (!result.authToken) {
      window.location.href = "login.html";
      return;
    }
  });

    logoutBtn.addEventListener("click", () => {
chrome.storage.local.remove("authToken", () => {
  window.location.href = "login.html";
});
});
  let groupedConnections = [];

  chrome.storage.local.get(["authToken"], async (result) => {
    if (result.authToken) {
      const response = await fetch(
        "http://localhost:3000/api/getGroupedConnections",
        {
          headers: {
            Authorization: `Bearer ${result.authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      groupedConnections = await response.json();
      console.log(groupedConnections);
      renderConnections(groupedConnections);
    } else {
      window.location.href = "login.html";
    }
  });

  function renderConnections(list) {
    connectionsContainer.innerHTML = '';
    list.forEach((group) => {
      const groupDiv = document.createElement("div");
      groupDiv.classList.add("connection-group", "bg-white", "p-4", "shadow-md", "rounded-md", "relative","mb-3");
      const groupTitle = document.createElement("h3");
      groupTitle.classList.add("text-lg", "font-semibold");
      groupTitle.textContent = group._id;
      groupDiv.addEventListener("click", () => {
        const connectionList = groupDiv.querySelector(".connections-list");
        connectionList.classList.toggle("hidden");
      });

      const connectionsList = document.createElement("div");


      connectionsList.classList.add("connections-list", "hidden");

      group.connections.forEach((connection) => {
        const connectionDiv = document.createElement("div");
        connectionDiv.classList.add("connection", "mt-2", "border-t", "border-gray-200", "pt-2");

        const name = document.createElement("a");
        name.classList.add("text-blue-600", "hover:underline");
        name.textContent = connection.name;
        name.href = connection.url;
        name.target = "_blank";

        const note = document.createElement("p");
        note.textContent = `Note: ${connection.connectionNote}`;

        const timestamp = document.createElement("p");
        timestamp.classList.add("text-sm", "text-gray-500");
        timestamp.textContent = `Sent on: ${new Date(connection.timestamp).toLocaleString()}`;

        connectionDiv.appendChild(name);
        connectionDiv.appendChild(note);
        connectionDiv.appendChild(timestamp);
        connectionsList.appendChild(connectionDiv);
      });

      groupDiv.appendChild(groupTitle);
      groupDiv.appendChild(connectionsList);
      connectionsContainer.appendChild(groupDiv);
    });

    updateConnectionCounter(list);
  }

  function sortListsByLatest(lists) {
    return lists.sort((a, b) => {
      const latestA = a.connections.reduce((latest, current) => new Date(latest.timestamp) > new Date(current.timestamp) ? latest : current);
      const latestB = b.connections.reduce((latest, current) => new Date(latest.timestamp) > new Date(current.timestamp) ? latest : current);
      return new Date(latestB.timestamp) - new Date(latestA.timestamp);
    });
  }

  function filterListsByKeyword(lists, keyword) {
    return lists.filter(list => list._id.toLowerCase().includes(keyword.toLowerCase()));
  }

  function updateConnectionCounter(lists) {
    const totalConnections = lists.reduce((total, list) => total + list.connections.length, 0);
    connectionCounter.textContent = totalConnections;
  }

  searchBar.addEventListener('input', (e) => {
    const keyword = e.target.value;
    const filteredLists = filterListsByKeyword(groupedConnections, keyword);
    renderConnections(sortListsByLatest(filteredLists));
  });

  // Initial render
  const sortedLists = sortListsByLatest(groupedConnections);
  renderConnections(sortedLists);
});
