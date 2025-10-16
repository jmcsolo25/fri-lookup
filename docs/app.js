function bandFor(score) {
  if (score <= 2) return "Low";
  if (score <= 5) return "Elevated";
  if (score <= 8) return "High";
  return "Critical";
}

function adviceFor(band) {
  switch (band) {
    case "Low": return "Normal conditions. Know your route; buddy up.";
    case "Elevated": return "Share legal hotline; avoid chokepoints.";
    case "High": return "Use trained marshals; have clear exit lanes.";
    case "Critical": return "Tight comms; buffers; livestream if safe.";
  }
}

document.getElementById("check").addEventListener("click", () => {
  const date = document.getElementById("date").value;
  const state = (document.getElementById("state").value || "").trim().toUpperCase();
  const city = (document.getElementById("city").value || "").trim();

  if (!date || !state) {
    document.getElementById("output").innerText = "Please enter a date and a state.";
    return;
  }

  // Temporary demo logic
  const seed = (date + state + city).length;
  const score = seed % 11;
  const band = bandFor(score);
  document.getElementById("output").innerText = `Risk score: ${score}/10 (${band})`;
  document.getElementById("advisory").innerText = adviceFor(band);
});
