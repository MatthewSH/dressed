import type { AnyEvent } from "./event.ts";
import type {
  CommandInteraction,
  CommandAutocompleteInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from "./interaction.ts";
import type {
  setupCommands,
  setupComponents,
  setupEvents,
} from "../server/index.ts";

export type CommandHandler = (interaction: CommandInteraction) => Promise<void>;
export type CommandAutocompleteHandler = (
  interaction: CommandAutocompleteInteraction,
) => Promise<void>;
export type ComponentHandler = (
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  args?: Record<string, string>,
) => Promise<void>;
export type EventHandler = (event: AnyEvent) => Promise<void>;

export type CommandRunner = ReturnType<typeof setupCommands>;
export type ComponentRunner = ReturnType<typeof setupComponents>;
export type EventRunner = ReturnType<typeof setupEvents>;
