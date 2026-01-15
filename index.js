import express from "express";
import fetch from "node-fetch";

async function blockIPCloudflare(ip) {
  const url = `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/firewall/access_rules/rules`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode: "block",
      configuration: {
        target: "ip",
        value: ip
      },
      notes: "ThreatPilot automated remediation"
    })
  });

  const data = await response.json();

  if (!data.success) {
    console.error("Cloudflare error:", data);
    throw new Error("Cloudflare IP block failed");
  }

  return data.result;
}

const app = express();
app.use(express.json());

/**
 * Single remediation endpoint
 * Agent yahin call karega
 */
app.post("/execute", async (req, res) => {
  const { action, target } = req.body;

  // Basic validation
  if (!action) {
    return res.status(400).json({
      status: "error",
      message: "Action is required"
    });
  }

  // ---- ACTION HANDLING (SIMULATED) ----

  if (action === "block_ip") {
    
    // return res.json({
    //   status: "success",
    //   action_taken: "block_ip",
    //   target,
    //   method: "firewall_simulation",
    //   message: `IP ${target} blocked`,
    //   executed_at: new Date().toISOString()
    // });

    const rule = await blockIPCloudflare(target);

    return res.json({
      status: "success",
      action_taken: "block_ip",
      target,
      method: "cloudflare_firewall",
      cloudflare_rule_id: rule.id,
      message: `IP ${target} blocked via Cloudflare`,
      executed_at: new Date().toISOString()
    });
    
  }

  if (action === "block_endpoint") {
    return res.json({
      status: "success",
      action_taken: "block_endpoint",
      target,
      method: "app_config_simulation",
      message: `Endpoint ${target} disabled`,
      executed_at: new Date().toISOString()
    });
  }

  if (action === "add_waf_rule") {
    return res.json({
      status: "success",
      action_taken: "add_waf_rule",
      rule: target,
      method: "waf_simulation",
      message: "WAF rule added",
      executed_at: new Date().toISOString()
    });
  }

  if (action === "alert_sre") {
    return res.json({
      status: "success",
      action_taken: "alert_sre",
      method: "alert_simulation",
      message: "SRE team notified",
      executed_at: new Date().toISOString()
    });
  }

  // Fallback
  return res.status(400).json({
    status: "ignored",
    message: "Unsupported action"
  });
});

// IMPORTANT: On-Demand uses PORT env var
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HTTP Remediation Service running on port ${PORT}`);
});
