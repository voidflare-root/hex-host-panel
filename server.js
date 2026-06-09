require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const GH = process.env.GITHUB_TOKEN;
const RW = process.env.RAILWAY_API_TOKEN;
const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const ENV_ID = process.env.RAILWAY_ENVIRONMENT_ID;

async function railway(query, variables = {}) {
  const res = await axios.post(
    "https://backboard.railway.app/graphql/v2",
    { query, variables },
    { headers: { Authorization: `Bearer ${RW}` } }
  );
  if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));
  return res.data.data;
}

app.get("/api/repos", async (req, res) => {
  try {
    const r = await axios.get("https://api.github.com/user/repos?per_page=100", {
      headers: { Authorization: `Bearer ${GH}` }
    });

    res.json(r.data.map(x => ({
      name: x.name,
      full_name: x.full_name,
      branch: x.default_branch,
      private: x.private
    })));
  } catch (e) {
    res.status(500).json({ error: "GitHub repos load failed", details: e.message });
  }
});

app.post("/api/deploy", async (req, res) => {
  try {
    const { repo, branch, startCommand } = req.body;

    const q = `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
        }
      }
    `;

    const data = await railway(q, {
      input: {
        projectId: PROJECT_ID,
        name: repo.split("/")[1],
        source: {
          repo: repo,
          branch: branch || "main"
        }
      }
    });

    res.json({
      success: true,
      message: "Service create request sent to Railway",
      service: data.serviceCreate,
      logs: [
        "Connecting GitHub repository...",
        "Creating Railway service...",
        "Build will start in Railway dashboard...",
        startCommand ? `Start command: ${startCommand}` : "Using Railway auto-detect start command"
      ]
    });
  } catch (e) {
    res.status(500).json({ error: "Railway deploy failed", details: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("HEX Host Panel running");
});
