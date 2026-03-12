export class ScreenManager {
  constructor(container) {
    this.container = container;
    this.screens = {};
    this.currentScreen = null;
    this.currentName = null;
  }

  register(name, screen) {
    this.screens[name] = screen;
  }

  async switchTo(name, data = {}) {
    if (this.currentScreen && this.currentScreen.exit) {
      await this.currentScreen.exit();
    }
    this.container.innerHTML = '';

    const screen = this.screens[name];
    if (!screen) throw new Error(`Screen "${name}" not found`);

    this.currentScreen = screen;
    this.currentName = name;
    await screen.enter(this.container, data);
  }
}
