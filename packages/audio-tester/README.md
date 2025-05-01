# Audio Tester

A TypeScript utility for testing audio file processing and manipulation.

## Installation

```bash
cd packages/audio-tester
npm install
```

## Development

Build the project:
```bash
npm run build
```

Watch mode (for development):
```bash
npm run watch
```

Run the application:
```bash
npm start
```

Development with auto-reload:
```bash
npm run dev
```

## Testing

To run tests:
```bash
npm test
```

Clean build artifacts:
```bash
npm run clean
```

## Project Structure

```
audio-tester/
├── src/
│   └── index.ts     # Main entry point
├── test/
│   └── index.test.ts # Test files
├── dist/            # Compiled JavaScript
├── tsconfig.json    # TypeScript configuration
├── package.json     # Package configuration
└── README.md       # This file
```

## TypeScript Configuration

The project uses modern TypeScript features with the following configuration highlights:
- Target: ES2022
- Module: NodeNext
- Strict type checking enabled
- Source maps and declaration files generated
- ESM modules 