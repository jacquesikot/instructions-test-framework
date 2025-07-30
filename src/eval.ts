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

interface CLIOptions {
  instructionFile?: string;
  datasetFile?: string;
  outputFile?: string;
  model?: string;
  technologies?: string[];
  help?: boolean;
}

// ========================
// CLI Parser
// ========================

class CLIParser {
  static parse(args: string[]): CLIOptions {
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--help':
        case '-h':
          options.help = true;
          break;
        case '--instruction-file':
        case '-i':
          if (nextArg && !nextArg.startsWith('-')) {
            options.instructionFile = nextArg;
            i++;
          }
          break;
        case '--dataset-file':
        case '-d':
          if (nextArg && !nextArg.startsWith('-')) {
            options.datasetFile = nextArg;
            i++;
          }
          break;
        case '--output-file':
        case '-o':
          if (nextArg && !nextArg.startsWith('-')) {
            options.outputFile = nextArg;
            i++;
          }
          break;
        case '--model':
        case '-m':
          if (nextArg && !nextArg.startsWith('-')) {
            options.model = nextArg;
            i++;
          }
          break;
        case '--technologies':
        case '-t':
          if (nextArg && !nextArg.startsWith('-')) {
            options.technologies = nextArg.split(',').map((tech) => tech.trim());
            i++;
          }
          break;
      }
    }

    return options;
  }

  static showHelp(): void {
    console.log(`
AI Component Evaluation Tool

Usage: npm run dev [options]

Options:
  -h, --help                    Show this help message
  -i, --instruction-file <path> Path to the instruction markdown file
  -d, --dataset-file <path>     Path to the dataset JSON file
  -o, --output-file <path>      Path to the output report file
  -m, --model <name>            OpenAI model to use (default: gpt-4o-mini)
  -t, --technologies <list>     Comma-separated list of technologies

Examples:
  npm run dev --instruction-file src/instructions/button.md --dataset-file src/datasets/button.json
  npm run dev -i src/instructions/select.md -d src/datasets/select.json -m gpt-4o
  npm run dev --technologies "React,TypeScript,Tailwind CSS"

Default Configuration:
  Instruction File: src/instructions/select.md
  Dataset File: src/datasets/select.json
  Output File: src/reports/select.md
  Model: gpt-4o-mini
  Technologies: Vite, React, Tailwind CSS, Shadcn UI, TypeScript
`);
  }
}

class ConfigManager {
  private static defaultConfig: EvaluationConfig = {
    instructionFile: 'src/instructions/select.md',
    datasetFile: 'src/datasets/select.json',
    outputFile: 'src/reports/select.md',
    model: 'gpt-4o-mini',
    technologies: ['Vite', 'React', 'Tailwind CSS', 'Shadcn UI', 'TypeScript'],
  };

  static createConfig(cliOptions: CLIOptions): EvaluationConfig {
    return {
      instructionFile: cliOptions.instructionFile || this.defaultConfig.instructionFile,
      datasetFile: cliOptions.datasetFile || this.defaultConfig.datasetFile,
      outputFile: cliOptions.outputFile || this.defaultConfig.outputFile,
      model: cliOptions.model || this.defaultConfig.model,
      technologies: cliOptions.technologies || this.defaultConfig.technologies,
    };
  }

  static validateConfig(config: EvaluationConfig): void {
    const errors: string[] = [];

    if (!fs.existsSync(config.instructionFile)) {
      errors.push(`Instruction file not found: ${config.instructionFile}`);
    }

    if (!fs.existsSync(config.datasetFile)) {
      errors.push(`Dataset file not found: ${config.datasetFile}`);
    }

    const outputDir = path.dirname(config.outputFile);
    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
      } catch (error) {
        errors.push(`Cannot create output directory: ${outputDir}`);
      }
    }

    if (errors.length > 0) {
      console.error('Configuration errors:');
      errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }
  }

  static logConfig(config: EvaluationConfig): void {
    console.log('Configuration:');
    console.log(`  Instruction File: ${config.instructionFile}`);
    console.log(`  Dataset File: ${config.datasetFile}`);
    console.log(`  Output File: ${config.outputFile}`);
    console.log(`  Model: ${config.model}`);
    console.log(`  Technologies: ${config.technologies.join(', ')}`);
    console.log('');
  }
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
  static generate(scenarios: EvaluationScenario[], outputDir: string, componentName: string): string {
    const now = new Date();
    const readableTimestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    // Create filename-safe timestamp
    const fileTimestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and Z
    const filename = `${componentName}-${fileTimestamp}.md`;
    const outputPath = path.join(outputDir, filename);

    const stats = this.calculateStatistics(scenarios);

    let report = this.generateHeader(stats, componentName, readableTimestamp);
    report += this.generateScenarioDetails(scenarios);

    // Write to unique file (no need to append since each file is unique)
    FileService.writeFile(outputPath, report);

    return outputPath;
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

  private static generateHeader(
    stats: ReturnType<typeof ReportGenerator.calculateStatistics>,
    componentName: string,
    timestamp: string
  ): string {
    return `# AI Evaluation Report - ${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Component

**Generated:** ${timestamp}
**Component:** ${componentName}
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

  static logSummary(scenarios: EvaluationScenario[], reportPath: string): void {
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
    console.log(`\nDetailed report saved to: ${reportPath}`);

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

    const componentName = path.basename(this.config.instructionFile, '.md');
    const outputDir = path.dirname(this.config.outputFile);
    const reportPath = ReportGenerator.generate(scenarios, outputDir, componentName);
    ConsoleLogger.logSummary(scenarios, reportPath);
  }
}

// ========================
// Main Execution
// ========================

function main(): void {
  // Parse command line arguments (skip first two: node and script path)
  const cliOptions = CLIParser.parse(process.argv.slice(2));

  // Show help if requested
  if (cliOptions.help) {
    CLIParser.showHelp();
    process.exit(0);
  }

  // Create configuration from CLI options and defaults
  const config = ConfigManager.createConfig(cliOptions);

  // Validate configuration
  ConfigManager.validateConfig(config);

  // Log the configuration being used
  ConfigManager.logConfig(config);

  // Run the evaluation
  const runner = new EvaluationRunner(config);
  runner.run().catch(console.error);
}

// Start the application
main();
