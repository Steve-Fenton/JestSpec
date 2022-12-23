# JestSpec

Gherkin feature files for Jest.

This project is a re-imagining of Gherkin features for JavaScript, based on lessons learned from writing and consuming specification-based test libraries for many languages.

The project was started by copying the specifications from TypeSpec (which I wrote for TypeScript).

The idea is to use Jest to provide the test goodies, but allow Gherkin specifications to drive the tests.

## To-do list

- Parse the arguments found in the text, based on the regex type (`(\d+)` should result in a number)
- Make the parsing of specs and steps simpler
- Make the body of the `test()` simpler

## Visual Studio Code experience

[Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)

[Syntax highlighting for Gherkin extension](https://marketplace.visualstudio.com/items?itemName=Blodwynn.featurehighlight)