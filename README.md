# AI Component Evaluation Tool

A TypeScript-based tool that uses OpenAI's GPT models to evaluate AI-generated React components against predefined instruction sets and test scenarios. This tool helps ensure that AI-generated components follow best practices, avoid common pitfalls, and meet specific requirements.

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd instructions-llm-test
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the tool**

   ```bash
   # Run with default configuration (select component)
   npm run dev

   # Run with specific files
   npm run dev --instruction-file src/instructions/button.md --dataset-file src/datasets/button.json
   ```

## 📁 Project Structure

```
src/
├── datasets/           # Test scenario datasets (JSON files)
│   ├── button.json    # Button component test cases
│   └── select.json    # Select component test cases
├── instructions/       # Component instruction files
│   ├── button.md      # Button component guidelines
│   └── select.md      # Select component guidelines
├── reports/           # Generated evaluation reports
│   └── *.md          # Timestamped evaluation reports
└── eval.ts           # Main evaluation engine
```

## 🎯 How It Works

The tool follows this evaluation process:

1. **Load Instructions**: Reads component guidelines from markdown files
2. **Load Test Cases**: Imports test scenarios from JSON datasets
3. **Generate Components**: Uses OpenAI to create React components based on instructions
4. **Evaluate Components**: Uses OpenAI to assess if generated components meet criteria
5. **Generate Reports**: Creates detailed markdown reports with results

## 📝 Creating Instruction Files

Instruction files are markdown documents that define component guidelines and common pitfalls.

### Structure

````markdown
# Component Name Instructions

## Overview

Brief description of the component and its purpose.

## Common Pitfalls

### 1. Pitfall Name

**Issue**: Description of the problem
**RelatedComponents**: Related components or libraries
**Symptoms**:

- List of symptoms
- That indicate this issue

**Solution**: How to fix the issue

**Example**:

```jsx
// ❌ Wrong way
// Bad code example

// ✅ Correct way
// Good code example
```
````

### 2. Another Pitfall

...

````

### Example: Button Instructions

See `src/instructions/button.md` for a complete example covering:
- Loading state implementation
- Icon button accessibility
- Form submission button types

## 📊 Creating Dataset Files

Dataset files contain test scenarios in JSON format.

### Structure

```json
[
  {
    "scenarioId": 1,
    "description": "User requirement or component description",
    "evaluationPrompt": "Question to evaluate the generated component"
  },
  {
    "scenarioId": 2,
    "description": "Another test scenario",
    "evaluationPrompt": "Another evaluation question"
  }
]
````

### Example: Button Dataset

```json
[
  {
    "scenarioId": 1,
    "description": "Create a form submission button for a newsletter signup that shows loading state during API call",
    "evaluationPrompt": "Does this component implement proper loading state with disabled functionality and aria-label updates during async operations?"
  },
  {
    "scenarioId": 2,
    "description": "Create action buttons for a todo list with delete, edit, and share icons only",
    "evaluationPrompt": "Does this component provide proper aria-label attributes for all icon-only buttons to ensure screen reader accessibility?"
  }
]
```

## 🛠️ Usage Examples

### Basic Usage

```bash
# Use default configuration (select component)
npm run dev

# Test button component
npm run dev --instruction-file src/instructions/button.md --dataset-file src/datasets/button.json

# Use different OpenAI model
npm run dev --model gpt-4o

# Specify custom technologies
npm run dev --technologies "React,TypeScript,Material-UI"
```

### Command Line Options

| Option               | Short | Description                          | Default                                        |
| -------------------- | ----- | ------------------------------------ | ---------------------------------------------- |
| `--help`             | `-h`  | Show help message                    | -                                              |
| `--instruction-file` | `-i`  | Path to instruction markdown file    | `src/instructions/select.md`                   |
| `--dataset-file`     | `-d`  | Path to dataset JSON file            | `src/datasets/select.json`                     |
| `--output-file`      | `-o`  | Path to output report file           | `src/reports/select.md`                        |
| `--model`            | `-m`  | OpenAI model to use                  | `gpt-4o-mini`                                  |
| `--technologies`     | `-t`  | Comma-separated list of technologies | `Vite,React,Tailwind CSS,Shadcn UI,TypeScript` |

### Advanced Examples

```bash
# Custom output location
npm run dev -i src/instructions/button.md -d src/datasets/button.json -o reports/custom-button-report.md

# Different model with custom tech stack
npm run dev --model gpt-4o --technologies "Next.js,TypeScript,Chakra UI"

# Full custom configuration
npm run dev \
  --instruction-file src/instructions/custom-component.md \
  --dataset-file src/datasets/custom-tests.json \
  --output-file reports/custom-evaluation.md \
  --model gpt-4o \
  --technologies "React,TypeScript,Styled Components"
```

## 📋 Understanding Reports

Generated reports include:

### Summary Statistics

- Total scenarios tested
- Pass/fail counts
- Success rate percentage
- Average score

### Detailed Results

For each scenario:

- ✅/❌ Pass/fail status
- Score percentage
- Input description
- Evaluation question
- AI reasoning
- Generated component code
- Full AI evaluation response

### Example Report Structure

````markdown
# AI Evaluation Report - Button Component

**Generated:** January 15, 2024, 2:30:45 PM PST
**Component:** button
**Total Scenarios:** 20
**Passed:** 18
**Failed:** 2
**Success Rate:** 90.0%
**Average Score:** 90.0%

---

## Scenario 1 ✅ PASSED

**Score:** 100.0%

### Input Description

Create a form submission button that shows loading state during API call

### Evaluation Question

Does this component implement proper loading state with disabled functionality?

### AI Reasoning

The component correctly implements loading state with proper disabled functionality...

### Generated Component Code

```typescript
// Generated component code here
```
````

````

## 🔧 Development

### Building the Project

```bash
npm run build
````

### Project Configuration

The tool uses these default settings:

- **Model**: `gpt-4o-mini`
- **Technologies**: Vite, React, Tailwind CSS, Shadcn UI, TypeScript
- **Instructions**: `src/instructions/select.md`
- **Dataset**: `src/datasets/select.json`
- **Output**: `src/reports/select.md`

### Environment Variables

| Variable         | Description         | Required |
| ---------------- | ------------------- | -------- |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes      |

## 🎨 Best Practices

### Writing Good Instructions

1. **Be Specific**: Clearly define what constitutes good vs. bad implementations
2. **Include Examples**: Provide both correct and incorrect code examples
3. **Cover Edge Cases**: Address common pitfalls and accessibility concerns
4. **Use Clear Structure**: Organize with consistent headings and formatting

### Creating Effective Test Cases

1. **Diverse Scenarios**: Cover different use cases and complexity levels
2. **Clear Evaluation Criteria**: Write specific, measurable evaluation questions
3. **Balanced Testing**: Include both positive and negative test cases
4. **Real-World Relevance**: Base scenarios on actual development needs

### Optimizing Evaluations

1. **Model Selection**: Use `gpt-4o` for more accurate evaluations, `gpt-4o-mini` for faster/cheaper runs
2. **Batch Processing**: Process multiple scenarios in sequence for efficiency
3. **Report Analysis**: Review failed scenarios to improve instructions and datasets

## 🤝 Contributing

1. Create new instruction files in `src/instructions/`
2. Add corresponding datasets in `src/datasets/`
3. Test your configurations thoroughly
4. Document any new features or changes

## 📄 License

[Add your license information here]

## 🆘 Troubleshooting

### Common Issues

**API Key Error**

```
Error: OpenAI API key not found
```

Solution: Ensure `.env` file exists with valid `OPENAI_API_KEY`

**File Not Found**

```
Configuration errors:
- Instruction file not found: path/to/file.md
```

Solution: Verify file paths exist or use absolute paths

**Model Access Error**

```
Error: Model 'gpt-4o' not available
```

Solution: Check your OpenAI account has access to the specified model

### Getting Help

- Check the console output for detailed error messages
- Verify all file paths are correct
- Ensure your OpenAI API key has sufficient credits
- Review the generated reports for evaluation insights
