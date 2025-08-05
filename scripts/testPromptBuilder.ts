#!/usr/bin/env -S deno run -A

/**
 * Test harness for Prompt Builder Edge Functions
 * Verifies that both prompt_builder_followups and prompt_builder_generate work correctly
 */

interface FollowupResponse {
  followup_questions?: string[];
  prompt?: string;
}

interface GenerateResponse {
  prompt?: string;
}

const SAMPLE_PAYLOAD = {
  "goal": "Summarize a blog post for LinkedIn",
  "input_type": ["Pasted Text"],
  "input_description": "A ~1000 word blog with 3-5 sections",
  "output_format": ["Plain Text", "Bullet Points"],
  "output_description": "A 150–300 word post with 2-3 takeaways",
  "constraints": ["Use headers"],
  "tone": "Friendly"
};

const FUNCTIONS_PORT = 54321;
const BASE_URL = `http://localhost:${FUNCTIONS_PORT}/functions/v1`;

let serverProcess: Deno.ChildProcess | null = null;

async function startFunctionsServer(): Promise<void> {
  console.log("🚀 Starting Supabase functions server...");
  
  const command = new Deno.Command("supabase", {
    args: ["functions", "serve", "--port", FUNCTIONS_PORT.toString()],
    stdout: "piped",
    stderr: "piped"
  });
  
  serverProcess = command.spawn();
  
  // Wait for server to be ready
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${BASE_URL}/prompt_builder_followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (response.status !== 500) break; // Server is responding
    } catch {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error("❌ Functions server failed to start within 30 seconds");
  }
  
  console.log("✅ Functions server is ready");
}

async function stopFunctionsServer(): Promise<void> {
  if (serverProcess) {
    console.log("🛑 Stopping functions server...");
    serverProcess.kill("SIGTERM");
    await serverProcess.status;
    serverProcess = null;
  }
}

async function testFollowups(): Promise<string[] | null> {
  console.log("🧪 Testing prompt_builder_followups...");
  
  try {
    const response = await fetch(`${BASE_URL}/prompt_builder_followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SAMPLE_PAYLOAD)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const responseText = await response.text();
    console.log("📥 Followups response:", responseText);
    
    // Parse the response - it might be double-encoded JSON
    let data: FollowupResponse;
    try {
      const parsed = JSON.parse(responseText);
      data = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    if (data.followup_questions && Array.isArray(data.followup_questions)) {
      console.log("✅ Received follow-up questions:", data.followup_questions);
      return data.followup_questions;
    } else if (data.prompt && typeof data.prompt === 'string' && data.prompt.trim()) {
      console.log("✅ Received final prompt directly (no follow-ups needed)");
      return null; // No follow-ups needed
    } else {
      throw new Error("Response missing both followup_questions and prompt");
    }
  } catch (error) {
    throw new Error(`Followups test failed: ${error.message}`);
  }
}

async function testGenerate(followupQuestions?: string[]): Promise<string> {
  console.log("🧪 Testing prompt_builder_generate...");
  
  // Create payload with clarifications if we have follow-up questions
  const payload = { ...SAMPLE_PAYLOAD };
  if (followupQuestions) {
    payload.clarifications = followupQuestions.map((_, index) => `Answer ${index + 1}`);
  }
  
  try {
    const response = await fetch(`${BASE_URL}/prompt_builder_generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const responseText = await response.text();
    console.log("📥 Generate response:", responseText);
    
    // Parse the response - it might be double-encoded JSON
    let data: GenerateResponse;
    try {
      const parsed = JSON.parse(responseText);
      data = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    if (!data.prompt || typeof data.prompt !== 'string' || !data.prompt.trim()) {
      throw new Error("Response missing prompt or prompt is empty");
    }
    
    console.log("✅ Generated prompt:", data.prompt.substring(0, 100) + "...");
    return data.prompt;
  } catch (error) {
    throw new Error(`Generate test failed: ${error.message}`);
  }
}

async function runTests(): Promise<void> {
  try {
    console.log("🎯 Starting Prompt Builder backend tests...\n");
    
    // Start the functions server
    await startFunctionsServer();
    
    // Test followups endpoint
    const followupQuestions = await testFollowups();
    
    // Test generate endpoint
    const generatedPrompt = await testGenerate(followupQuestions);
    
    console.log("\n🎉 All tests passed!");
    console.log("✅ PASS - Prompt Builder backend is working correctly");
    
  } catch (error) {
    console.error("\n💥 Test failed:");
    console.error("❌ FAIL -", error.message);
    Deno.exit(1);
  } finally {
    await stopFunctionsServer();
  }
}

// Handle cleanup on exit
Deno.addSignalListener("SIGINT", async () => {
  await stopFunctionsServer();
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", async () => {
  await stopFunctionsServer();
  Deno.exit(0);
});

// Run the tests
if (import.meta.main) {
  await runTests();
}