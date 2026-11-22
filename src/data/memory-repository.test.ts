import { createMemoryRepository } from "./memory-repository";
import { describeRepositoryContract } from "./repository.contract";

describeRepositoryContract("mémoire", () => createMemoryRepository());
