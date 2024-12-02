document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:3000/api/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).catch((err) => {
    alert("Internal server error");
  });

  const data = await response.json();

  if (data.success) {
    chrome.storage.local.set({ authToken: data.token }, () => {
      window.location.href = "home.html";
    });
  } else {
    alert("Login failed: " + data.message);
  }
});
