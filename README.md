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
   cd instructions-test-framework
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
```

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
