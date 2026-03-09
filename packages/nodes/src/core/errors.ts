export class NonRetriableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetriableError";
  }
}

export class NodeConfigurationError extends NonRetriableError {
  constructor(nodeType: string, message: string) {
    super(`${nodeType}: ${message}`);
    this.name = "NodeConfigurationError";
  }
}
