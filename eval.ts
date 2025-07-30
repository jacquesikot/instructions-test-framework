import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EvalResult {
  passed: boolean;
  output: string;
  score: number;
  testPrompt: string;
  aiEvaluation: string;
  reasoning: string;
}

/**
 * Runs an evaluation by combining instructions with a test prompt
 * and using AI to evaluate if the generated code meets the requirements.
 *
 * @param instructionFile Path to instructions.md
 * @param testPrompt User query to test against
 * @param evaluationPrompt The test question to ask the AI evaluator
 */
async function runEval(instructionFile: string, testPrompt: string, evaluationPrompt: string): Promise<EvalResult> {
  const filePath = path.resolve(instructionFile);
  const instructions = fs.readFileSync(filePath, 'utf-8');
  const useInstructions = true;

  // Step 1: Generate the component code
  const generatePrompt = `
You are given component instructions:
${useInstructions ? instructions : ''}

Ensure to use the following technologies:
- Vite
- React
- Tailwind CSS
- Shadcn UI
- TypeScript

Ensure to use the select component from shadcn ui.

Return only the select component code. Nothing else.

User query:
${testPrompt}
`;

  const generateResponse = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: generatePrompt }],
  });

  const output = generateResponse.choices[0]?.message?.content ?? '';

  // Step 2: Evaluate the generated code with AI
  const evalPrompt = `
You are an expert code reviewer. Analyze the following React component code and answer the specific question below.

Generated Component Code:
\`\`\`
${output}
\`\`\`

Question: ${evaluationPrompt}

Please respond with:
1. A clear YES or NO answer
2. Your reasoning explaining why

Format your response as:
ANSWER: [YES/NO]
REASONING: [Your detailed explanation]
`;

  const evalResponse = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: evalPrompt }],
  });

  const aiEvaluation = evalResponse.choices[0]?.message?.content ?? '';

  // Parse the AI response to extract answer and reasoning
  const answerMatch = aiEvaluation.match(/ANSWER:\s*(YES|NO)/i);
  const reasoningMatch = aiEvaluation.match(/REASONING:\s*(.*)/s);

  const passed = answerMatch?.[1]?.toLowerCase() === 'yes';
  const reasoning = reasoningMatch?.[1]?.trim() || 'No reasoning provided';
  const score = passed ? 1 : 0;

  return {
    passed,
    output,
    score,
    testPrompt: evaluationPrompt,
    aiEvaluation,
    reasoning,
  };
}

// Test dataset
const testDataset = [
  // === VIRTUALIZATION TESTING (Large Datasets - Should Use Virtualization) ===
  {
    scenarioId: 1,
    description:
      'Build a signup page for a global scholarship program where students select their university from over 2000 options',
    evaluationPrompt:
      'Does this component implement virtualization (using react-window) to handle the large dataset efficiently?',
  },
  {
    scenarioId: 2,
    description:
      'Create a form for an e-commerce admin dashboard where managers pick a product category from 3000+ categories before adding inventory',
    evaluationPrompt:
      'Does this component implement virtualization (using react-window or similar) to handle the large dataset of 3000+ categories efficiently?',
  },
  {
    scenarioId: 3,
    description:
      'Design a travel booking page where users select airports from 4000 international airport entries to set their departure location',
    evaluationPrompt:
      'Does this component implement virtualization (using react-window) when handling 4000+ airport options?',
  },
  {
    scenarioId: 4,
    description:
      'Build a job portal where candidates choose their university from a database of 2500+ global institutions',
    evaluationPrompt:
      'Does this component use virtualization (react-window) to efficiently render the 2500+ university options?',
  },
  {
    scenarioId: 5,
    description:
      'Create a medical records system where doctors select hospitals from a list of 1500+ healthcare facilities',
    evaluationPrompt:
      'Does this component implement virtualization (using react-window) to handle the large hospital dataset efficiently?',
  },

  // === NO VIRTUALIZATION TESTING (Small/Medium Datasets - Should NOT Use Virtualization) ===
  {
    scenarioId: 6,
    description:
      'Create a settings page for an educational app where teachers choose from 50 subjects and type details afterward',
    evaluationPrompt:
      'Does this component avoid using virtualization (since there are only 50 items) and instead render all options directly?',
  },
  {
    scenarioId: 7,
    description: 'Build a contact form where users select their country from 195 world countries',
    evaluationPrompt:
      'Does this component avoid virtualization (since 195 countries is manageable) and render all options normally?',
  },
  {
    scenarioId: 8,
    description: 'Design a survey form where participants pick their age range from 15 predefined brackets',
    evaluationPrompt: 'Does this component avoid using virtualization for the small dataset of 15 age ranges?',
  },
  {
    scenarioId: 9,
    description: 'Create a booking system where customers select appointment times from 120 available slots',
    evaluationPrompt:
      'Does this component avoid virtualization (120 items is below 200 threshold) and render all time slots directly?',
  },
  {
    scenarioId: 10,
    description: 'Build a charity event signup with a dropdown of 180 sponsor organizations and a comment field',
    evaluationPrompt: 'Does this component avoid using virtualization since 180 items is below the 200-item threshold?',
  },

  // === BOUNDARY TESTING (Around 200 Item Threshold) ===
  {
    scenarioId: 11,
    description: 'Create a form where users select their city from exactly 200 metropolitan areas worldwide',
    evaluationPrompt:
      'Does this component avoid virtualization since 200 items is exactly at the threshold (not exceeding it)?',
  },
  {
    scenarioId: 12,
    description: 'Design a dropdown for selecting skills from 201 programming technologies and frameworks',
    evaluationPrompt: 'Does this component implement virtualization since 201 items exceeds the 200-item threshold?',
  },

  // === FOCUS MANAGEMENT TESTING (With Delay Implementation) ===
  {
    scenarioId: 13,
    description:
      'Create an admin form to assign permissions by selecting a role from 100 options and moving focus to email input automatically',
    evaluationPrompt:
      'Does this component implement a 100ms delay when selecting a role and automatically focus the email input after selection?',
  },
  {
    scenarioId: 14,
    description:
      'Build a product creation form where managers select category from 150 options then immediately type in product name field',
    evaluationPrompt:
      'Does this component use setTimeout with 100ms delay before focusing the product name input after category selection?',
  },
  {
    scenarioId: 15,
    description:
      'Design a user registration form where users pick department from 80 options and continue typing their employee ID',
    evaluationPrompt:
      'Does this component implement a 100ms delay before automatically focusing the employee ID input after department selection?',
  },
  {
    scenarioId: 16,
    description:
      'Create a support ticket form where users select issue type from 45 categories then focus moves to description textarea',
    evaluationPrompt:
      'Does this component use a 100ms setTimeout delay before focusing the description textarea after issue type selection?',
  },

  // === COMBINED TESTING (Large Dataset + Focus Management) ===
  {
    scenarioId: 17,
    description:
      'Build a complex form where users select from 2500+ companies and then automatically focus moves to position title input',
    evaluationPrompt:
      'Does this component both implement virtualization for the large dataset AND use 100ms delay for focus management?',
  },
  {
    scenarioId: 18,
    description:
      'Create an inventory system where staff select from 3000+ products and focus automatically moves to quantity input field',
    evaluationPrompt:
      'Does this component implement virtualization (react-window) for the large product list AND handle focus management with 100ms delay?',
  },

  // === EDGE CASE TESTING ===
  {
    scenarioId: 19,
    description:
      'Design a form with no follow-up input where users select their preferred language from 500+ world languages',
    evaluationPrompt:
      'Does this component implement virtualization for the large dataset but avoid focus management since there is no subsequent input field?',
  },
  {
    scenarioId: 20,
    description:
      'Build a multi-step wizard where users select timezone from 50 options and must click Next button (no automatic focus)',
    evaluationPrompt:
      'Does this component avoid both virtualization (small dataset) and automatic focus management (no input field to focus)?',
  },
];

async function generateReport(
  results: Array<{
    scenarioId: number;
    description: string;
    evaluationPrompt: string;
    evalResult: EvalResult;
  }>
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const passedCount = results.filter((r) => r.evalResult.passed).length;
  const totalCount = results.length;
  const averageScore = results.reduce((sum, r) => sum + r.evalResult.score, 0) / totalCount;

  let report = `# AI Evaluation Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Total Scenarios:** ${totalCount}\n`;
  report += `**Passed:** ${passedCount}\n`;
  report += `**Failed:** ${totalCount - passedCount}\n`;
  report += `**Success Rate:** ${((passedCount / totalCount) * 100).toFixed(1)}%\n`;
  report += `**Average Score:** ${(averageScore * 100).toFixed(1)}%\n\n`;

  report += `---\n\n`;

  for (const result of results) {
    const { scenarioId, description, evaluationPrompt, evalResult } = result;
    const status = evalResult.passed ? '✅ PASSED' : '❌ FAILED';
    const scorePercent = (evalResult.score * 100).toFixed(1);

    report += `## Scenario ${scenarioId} ${status}\n\n`;
    report += `**Score:** ${scorePercent}%\n\n`;

    report += `### Input Description\n`;
    report += `${description}\n\n`;

    report += `### Evaluation Question\n`;
    report += `${evaluationPrompt}\n\n`;

    report += `### AI Evaluation Result\n`;
    report += `**Answer:** ${evalResult.passed ? 'YES' : 'NO'}\n\n`;

    report += `### AI Reasoning\n`;
    report += `${evalResult.reasoning}\n\n`;

    report += `### Generated Component Code\n`;
    report += `\`\`\`typescript\n${evalResult.output}\`\`\`\n\n`;

    report += `### Full AI Evaluation Response\n`;
    report += `\`\`\`\n${evalResult.aiEvaluation}\`\`\`\n\n`;

    report += `---\n\n`;
  }

  fs.writeFileSync('report.md', report, 'utf-8');
}

// Run evaluations
(async () => {
  console.log('Running AI-based evaluations...\n');

  const results: Array<{
    scenarioId: number;
    description: string;
    evaluationPrompt: string;
    evalResult: EvalResult;
  }> = [];

  for (const testCase of testDataset) {
    console.log(`Testing Scenario ${testCase.scenarioId}:`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Evaluation Question: ${testCase.evaluationPrompt}`);

    const evalResult = await runEval('select.md', testCase.description, testCase.evaluationPrompt);

    console.log(`Result: ${evalResult.passed ? 'PASSED' : 'FAILED'} (Score: ${(evalResult.score * 100).toFixed(1)}%)`);
    console.log(`AI Reasoning: ${evalResult.reasoning.slice(0, 100)}...\n`);

    results.push({
      scenarioId: testCase.scenarioId,
      description: testCase.description,
      evaluationPrompt: testCase.evaluationPrompt,
      evalResult,
    });
  }

  // Generate report
  await generateReport(results);

  // Summary
  const passedCount = results.filter((r) => r.evalResult.passed).length;
  const totalCount = results.length;
  const averageScore = results.reduce((sum, r) => sum + r.evalResult.score, 0) / totalCount;

  console.log('='.repeat(50));
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total scenarios: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log(`Success rate: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  console.log(`Average score: ${(averageScore * 100).toFixed(1)}%`);
  console.log('\nDetailed report saved to: report.md');

  // Show failed scenarios
  const failedScenarios = results.filter((r) => !r.evalResult.passed);
  if (failedScenarios.length > 0) {
    console.log('\nFailed scenarios:');
    failedScenarios.forEach((scenario) => {
      console.log(
        `- Scenario ${scenario.scenarioId}: ${scenario.description} (Score: ${(scenario.evalResult.score * 100).toFixed(
          1
        )}%)`
      );
    });
  }
})();
