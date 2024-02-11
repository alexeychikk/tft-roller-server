import { getClassGetters } from '@tft-roller';

export enum NodeEnv {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvService {
  readonly instanceCreatedAt = new Date();

  get IS_DEV(): boolean {
    return this.NODE_ENV === NodeEnv.Development;
  }

  get IS_TEST(): boolean {
    return this.NODE_ENV === NodeEnv.Test;
  }

  get IS_PROD(): boolean {
    return this.NODE_ENV === NodeEnv.Production;
  }

  get NAME(): string {
    return this.getVar('npm_package_name');
  }

  get NODE_ENV(): NodeEnv {
    return this.getVar('NODE_ENV', NodeEnv.Production).toLowerCase() as NodeEnv;
  }

  get PORT(): number {
    return parseInt(this.getVar('PORT'));
  }

  get VERSION(): string {
    return this.getVar('npm_package_version');
  }

  get ADMIN_PASSWORD(): string {
    return this.getVar('ADMIN_PASSWORD');
  }

  setVariable(variable: string, value: string) {
    process.env[variable] = value;
    return this;
  }

  ensureVariablesSet() {
    getClassGetters(Object.getPrototypeOf(this).constructor).forEach((getter) =>
      getter.value.call(this),
    );
  }

  protected getVar(name: string, defaultValue?: string) {
    const val = process.env[name];
    if (val !== undefined) {
      return val;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is missing`);
  }

  protected getJsonVar<Value>(name: string, defaultValue?: Value): Value {
    const stringValue = this.getVar(
      name,
      defaultValue === undefined ? undefined : '',
    );
    if (stringValue !== '') {
      try {
        return JSON.parse(stringValue) as Value;
      } catch (err) {
        throw new Error(`Environment variable ${name} is not in JSON format`);
      }
    }
    return defaultValue as Value;
  }
}
