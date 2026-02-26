const DATA_FILES = {
    teams: "data/teams.json",
    players: "data/players.json",
    winners: "data/winners.json",
    config: "data/config.json",
};

function byId(id) {
    return document.getElementById(id);
}

function setActiveTab(tab) {
    const safeTab = ["leaderboard", "entries", "rules"].includes(tab) ? tab : "leaderboard";

    ["leaderboard", "entries", "rules"].forEach((t) => {
        byId(`tab-${t}`).classList.toggle("active", t === safeTab);
        byId(`view-${t}`).hidden = t !== safeTab;
    });
}

window.addEventListener("hashchange", () => {
    const tab = location.hash.replace("#", "") || "leaderboard";
    setActiveTab(tab);
});

async function loadJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
    return res.json();
}

function computeStandings({ teams, players, winners }) {
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const groups = [...new Set(teams.map((t) => t.group))].sort();

    const results = players.map((p) => {
        let points = 0;
        let correct = 0;
        let fairPlay = 0;

        for (const g of groups) {
            const pickId = p.picks?.[g];
            if (!pickId) continue;

            const pickedTeam = teamMap.get(pickId);
            if (!pickedTeam) continue;

            // ✅ ALWAYS add fair play for the picked team (win or lose)
            fairPlay += Number(pickedTeam.fairPlay ?? 0);

            // ✅ Only score seed points + correct if the pick matches the winner
            const winnerId = winners?.[g] ?? null;
            if (winnerId && winnerId === pickId) {
                points += Number(pickedTeam.seed ?? 0);
                correct += 1;
            }
        }

        return { ...p, points, correct, fairPlay };
    });

    // ✅ Sort with tie-breakers:
    // 1) points desc
    // 2) correct desc
    // 3) fairPlay asc (lower is better)
    results.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.correct !== a.correct) return b.correct - a.correct;
        return a.fairPlay - b.fairPlay;
    });

    return { results, groups, teamMap };
}

function renderLeaderboard(standings) {
    const tbody = byId("leaderboardTable").querySelector("tbody");
    tbody.innerHTML = "";

    standings.results.forEach((r, i) => {
        tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.name)}</td>
        <td class="num">${r.points}</td>
        <td class="num">${r.correct}</td>
        <td class="num">${r.fairPlay}</td>
      </tr>
    `;
    });
}

/**
 * ENTRIES:
 * Name + Points only (no Correct / Fair Play totals on this page)
 * Still shows Seed + FP for the selected team within each group cell.
 */
function renderEntries(standings) {
    const head = byId("entriesHead");
    const body = byId("entriesBody");

    head.innerHTML = `
    <tr>
      <th>Name</th>
      <th class="num">Points</th>
      ${standings.groups.map((g) => `<th>${escapeHtml(g)}</th>`).join("")}
    </tr>
  `;

    body.innerHTML = "";

    standings.results.forEach((r) => {
        body.innerHTML += `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td class="num">${r.points}</td>
        ${standings.groups
                .map((g) => {
                    const teamId = r.picks?.[g];
                    const t = standings.teamMap.get(teamId);

                    return t
                        ? `<td>
                   <strong>${escapeHtml(t.name)}</strong><br>
                   <span class="muted">Seed ${Number(t.seed ?? 0)} • FP ${Number(t.fairPlay ?? 0)}</span>
                 </td>`
                        : `<td>-</td>`;
                })
                .join("")}
      </tr>
    `;
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => {
        switch (c) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#039;";
            default:
                return c;
        }
    });
}

function setupMakePicksButton(config) {
    const btn = byId("makePicksBtn");
    if (!btn) return;

    const isOpen = Boolean(config?.submissionsOpen);
    const url = config?.googleFormUrl;

    if (isOpen && typeof url === "string" && url.trim().length > 0) {
        btn.hidden = false;
        btn.onclick = () => window.open(url, "_blank", "noopener,noreferrer");
    } else {
        btn.hidden = true;
        btn.onclick = null;
    }
}

async function init() {
    try {
        const [teams, players, winners, config] = await Promise.all([
            loadJson(DATA_FILES.teams),
            loadJson(DATA_FILES.players),
            loadJson(DATA_FILES.winners),
            loadJson(DATA_FILES.config),
        ]);

        setupMakePicksButton(config);

        const standings = computeStandings({ teams, players, winners });
        renderLeaderboard(standings);
        renderEntries(standings);

        setActiveTab(location.hash.replace("#", "") || "leaderboard");
    } catch (err) {
        console.error(err);
        alert(
            `Error loading data: ${err.message}\n\nMake sure you're running this via a web server (GitHub Pages / Netlify / local server), not file://`
        );
    }
}

init();