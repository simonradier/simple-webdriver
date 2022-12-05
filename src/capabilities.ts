export class Capabilities {
  public args: string[] = new Array<string>()

  public addArguments(arg: string) {
    this.args.push(arg)
  }

  public get headless(): boolean {
    return this.args.some(arg => arg.includes('headless'))
  }

  public static headless = new Capabilities()
  public static default = new Capabilities()
}

Capabilities.headless.args = ['--headless']
