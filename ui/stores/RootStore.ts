import { AuthStore } from "./AuthStore";
import { ThemeStore } from "./ThemeStore";

export class RootStore {
  readonly authStore: AuthStore;
  readonly themeStore: ThemeStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.themeStore = new ThemeStore(this);
  }
}
