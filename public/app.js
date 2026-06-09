async function loadRepos() {
  log("Loading GitHub repositories...");
  const r = await fetch("/api/repos");
  const repos = await r.json();

  const box = document.getElementById("repos");
  box.innerHTML = "";

  repos.forEach(repo => {
    box.innerHTML += `
      <div class="repo">
        <b>${repo.full_name}</b><br>
        <small>Branch: ${repo.branch}</small><br><br>
        <button onclick="deploy('${repo.full_name}','${repo.branch}')">Host on Railway</button>
      </div>
    `;
  });

  log("Repositories loaded successfully.");
}

async function deploy(repo, branch) {
  log("Starting deploy...");
  log("Repo: " + repo);
  log("Branch: " + branch);

  const r = await fetch("/api/deploy", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      repo,
      branch,
      startCommand: "npm start"
    })
  });

  const data = await r.json();

  if (data.logs) data.logs.forEach(x => log(x));
  log(JSON.stringify(data, null, 2));
}

function log(text) {
  const logs = document.getElementById("logs");
  logs.textContent += "\n> " + text;
  logs.scrollTop = logs.scrollHeight;
}
