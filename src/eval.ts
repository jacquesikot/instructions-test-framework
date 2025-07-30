import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ========================
// Types & Interfaces
// ========================

interface TestCase {
  scenarioId: number;
  description: string;
  evaluationPrompt: string;
}

interface EvalResult {
  passed: boolean;
  output: string;
  score: number;
  testPrompt: string;
  aiEvaluation: string;
  reasoning: string;
}

interface EvaluationScenario {
  scenarioId: number;
  description: string;
  evaluationPrompt: string;
  evalResult: EvalResult;
}

interface EvaluationConfig {
  instructionFile: string;
  datasetFile: string;
  outputFile: string;
  model: string;
  technologies: string[];
}

class OpenAIService {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateCompletion(prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content ?? '';
  }
}

class FileService {
  static readFile(filePath: string): string {
    const resolvedPath = path.resolve(filePath);
    return fs.readFileSync(resolvedPath, 'utf-8');
  }

  static writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  static loadJsonDataset<T>(filePath: string): T[] {
    const content = this.readFile(filePath);
    return JSON.parse(content);
  }
}

class PromptTemplates {
  static createGenerationPrompt(
    instructions: string,
    technologies: string[],
    componentType: string,
    userQuery: string
  ): string {
    return `
      You are given component instructions:
      ${instructions}

      Ensure to use the following technologies:
      ${technologies.map((tech) => `- ${tech}`).join('\n')}

      Ensure to use the ${componentType} component from shadcn ui.

      Return only the ${componentType} component code. Nothing else.

      User query:
      ${userQuery}
      `;
  }

  static createEvaluationPrompt(generatedCode: string, evaluationQuestion: string): string {
    return `
      You are an expert code reviewer. Analyze the following React component code and answer the specific question below.

      Generated Component Code:
      \`\`\`
      ${generatedCode}
      \`\`\`

      Question: ${evaluationQuestion}

      Please respond with:
      1. A clear YES or NO answer
      2. Your reasoning explaining why

      Format your response as:
      ANSWER: [YES/NO]
      REASONING: [Your detailed explanation]
      `;
  }
}

class EvaluationEngine {
  private openAIService: OpenAIService;
  private config: EvaluationConfig;

  constructor(config: EvaluationConfig, openAIService?: OpenAIService) {
    this.config = config;
    this.openAIService = openAIService || new OpenAIService();
  }

  async evaluateScenario(testCase: TestCase): Promise<EvalResult> {
    const instructions = FileService.readFile(this.config.instructionFile);

    // Generate component code
    const generationPrompt = PromptTemplates.createGenerationPrompt(
      instructions,
      this.config.technologies,
      this.extractComponentType(),
      testCase.description
    );

    const output = await this.openAIService.generateCompletion(generationPrompt, this.config.model);

    // Evaluate the generated code
    const evaluationPrompt = PromptTemplates.createEvaluationPrompt(output, testCase.evaluationPrompt);
    const aiEvaluation = await this.openAIService.generateCompletion(evaluationPrompt, this.config.model);

    return this.parseEvaluationResponse(output, testCase.evaluationPrompt, aiEvaluation);
  }

  private extractComponentType(): string {
    // Extract component type from instruction file path
    const fileName = path.basename(this.config.instructionFile, '.md');
    return fileName;
  }

  private parseEvaluationResponse(output: string, testPrompt: string, aiEvaluation: string): EvalResult {
    const answerMatch = aiEvaluation.match(/ANSWER:\s*(YES|NO)/i);
    const reasoningMatch = aiEvaluation.match(/REASONING:\s*(.*)/s);

    const passed = answerMatch?.[1]?.toLowerCase() === 'yes';
    const reasoning = reasoningMatch?.[1]?.trim() || 'No reasoning provided';
    const score = passed ? 1 : 0;

    return {
      passed,
      output,
      score,
      testPrompt,
      aiEvaluation,
      reasoning,
    };
  }
}

class ReportGenerator {
  static generate(scenarios: EvaluationScenario[], outputPath: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stats = this.calculateStatistics(scenarios);

    let report = this.generateHeader(stats);
    report += this.generateScenarioDetails(scenarios);

    FileService.writeFile(outputPath, report);
  }

  private static calculateStatistics(scenarios: EvaluationScenario[]) {
    const totalCount = scenarios.length;
    const passedCount = scenarios.filter((s) => s.evalResult.passed).length;
    const averageScore = scenarios.reduce((sum, s) => sum + s.evalResult.score, 0) / totalCount;

    return {
      totalCount,
      passedCount,
      failedCount: totalCount - passedCount,
      successRate: (passedCount / totalCount) * 100,
      averageScore: averageScore * 100,
    };
  }

  private static generateHeader(stats: ReturnType<typeof ReportGenerator.calculateStatistics>): string {
    return `# AI Evaluation Report

            **Generated:** ${new Date().toLocaleString()}
            **Total Scenarios:** ${stats.totalCount}
            **Passed:** ${stats.passedCount}
            **Failed:** ${stats.failedCount}
            **Success Rate:** ${stats.successRate.toFixed(1)}%
            **Average Score:** ${stats.averageScore.toFixed(1)}%

            ---

            `;
  }

  private static generateScenarioDetails(scenarios: EvaluationScenario[]): string {
    return scenarios
      .map((scenario) => {
        const { scenarioId, description, evaluationPrompt, evalResult } = scenario;
        const status = evalResult.passed ? '✅ PASSED' : '❌ FAILED';
        const scorePercent = (evalResult.score * 100).toFixed(1);

        return `## Scenario ${scenarioId} ${status}

          **Score:** ${scorePercent}%

          ### Input Description
          ${description}

          ### Evaluation Question
          ${evaluationPrompt}

          ### AI Evaluation Result
          **Answer:** ${evalResult.passed ? 'YES' : 'NO'}

          ### AI Reasoning
          ${evalResult.reasoning}

          ### Generated Component Code
          \`\`\`typescript
          ${evalResult.output}
          \`\`\`

          ### Full AI Evaluation Response
          \`\`\`
          ${evalResult.aiEvaluation}
          \`\`\`

          ---

          `;
      })
      .join('');
  }
}

class ConsoleLogger {
  static logScenarioStart(testCase: TestCase): void {
    console.log(`Testing Scenario ${testCase.scenarioId}:`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Evaluation Question: ${testCase.evaluationPrompt}`);
  }

  static logScenarioResult(evalResult: EvalResult): void {
    console.log(`Result: ${evalResult.passed ? 'PASSED' : 'FAILED'} (Score: ${(evalResult.score * 100).toFixed(1)}%)`);
    console.log(`AI Reasoning: ${evalResult.reasoning.slice(0, 100)}...\n`);
  }

  static logSummary(scenarios: EvaluationScenario[]): void {
    const passedCount = scenarios.filter((s) => s.evalResult.passed).length;
    const totalCount = scenarios.length;
    const averageScore = scenarios.reduce((sum, s) => sum + s.evalResult.score, 0) / totalCount;

    console.log('='.repeat(50));
    console.log('EVALUATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total scenarios: ${totalCount}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${totalCount - passedCount}`);
    console.log(`Success rate: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
    console.log(`Average score: ${(averageScore * 100).toFixed(1)}%`);
    console.log('\nDetailed report saved to: src/reports/report.md');

    this.logFailedScenarios(scenarios);
  }

  private static logFailedScenarios(scenarios: EvaluationScenario[]): void {
    const failedScenarios = scenarios.filter((s) => !s.evalResult.passed);
    if (failedScenarios.length > 0) {
      console.log('\nFailed scenarios:');
      failedScenarios.forEach((scenario) => {
        console.log(
          `- Scenario ${scenario.scenarioId}: ${scenario.description} (Score: ${(
            scenario.evalResult.score * 100
          ).toFixed(1)}%)`
        );
      });
    }
  }
}

class EvaluationRunner {
  private engine: EvaluationEngine;
  private config: EvaluationConfig;

  constructor(config: EvaluationConfig) {
    this.config = config;
    this.engine = new EvaluationEngine(config);
  }

  async run(): Promise<void> {
    console.log('Running AI-based evaluations...\n');

    const testDataset = FileService.loadJsonDataset<TestCase>(this.config.datasetFile);
    const scenarios: EvaluationScenario[] = [];

    for (const testCase of testDataset) {
      ConsoleLogger.logScenarioStart(testCase);

      const evalResult = await this.engine.evaluateScenario(testCase);
      ConsoleLogger.logScenarioResult(evalResult);

      scenarios.push({
        scenarioId: testCase.scenarioId,
        description: testCase.description,
        evaluationPrompt: testCase.evaluationPrompt,
        evalResult,
      });
    }

    ReportGenerator.generate(scenarios, this.config.outputFile);
    ConsoleLogger.logSummary(scenarios);
  }
}

const config: EvaluationConfig = {
  instructionFile: 'src/instructions/select.md',
  datasetFile: 'src/datasets/select.json',
  outputFile: 'src/reports/report.md',
  model: 'gpt-4o-mini',
  technologies: ['Vite', 'React', 'Tailwind CSS', 'Shadcn UI', 'TypeScript'],
};

const runner = new EvaluationRunner(config);
runner.run().catch(console.error);
