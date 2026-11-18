
import { Plugin, Notice } from "obsidian";

export default class HelloWorldPlugin extends Plugin {
  async onload() {
    // Runs when Obsidian loads the plugin
    this.addCommand({
      id: "say-hello",
      name: "Say hello",
      callback: () => {
        new Notice("Hello from my first plugin!");
      },
    });
  }

  onunload() {
    // Runs when the plugin is disabled
  }
}
