import ora from "ora";
import { verifySignature } from "./signature.ts";
import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  type APIModalSubmitInteraction,
  type APIWebhookEventBody,
  ApplicationWebhookType,
  InteractionType,
} from "discord-api-types/v10";
import type {
  CommandRunner,
  ComponentRunner,
  EventRunner,
} from "../types/handlers.ts";
import type {
  CommandData,
  ComponentData,
  EventData,
  ServerConfig,
} from "../types/config.ts";
import { createServer as createHttpServer, type Server } from "node:http";
import { stdout } from "node:process";
import { Buffer } from "node:buffer";
import { createInteraction } from "./extenders/interaction.ts";
import { setupCommands } from "./handlers/commands.ts";
import { setupComponents } from "./handlers/components.ts";
import { setupEvents } from "./handlers/events.ts";

/**
 * Starts a server to handle interactions.
 * @returns The server instance
 */
export function createServer(
  commands: CommandRunner | CommandData[],
  components: ComponentRunner | ComponentData[],
  events: EventRunner | EventData[],
  config: ServerConfig,
): Server {
  const server = createHttpServer((req, res) => {
    if (req.url !== (config.endpoint ?? "/")) {
      res.statusCode = 404;
      res.end();
      return;
    } else if (req.method !== "POST") {
      res.statusCode = 405;
      res.end();
      return;
    }

    const chunks: Uint8Array[] = [];
    req
      .on("data", (c) => chunks.push(c))
      .on("end", async () => {
        const handlerRes = await handleRequest(
          new Request("http://localhost", {
            method: "POST",
            body: Buffer.concat(chunks),
            headers: req.headers as unknown as Headers,
          }),
          commands,
          components,
          events,
          config,
        );

        res.statusCode = handlerRes.status;
        res.setHeader("Content-Type", "application/json");
        res.end(handlerRes.status === 200 ? '{"type":1}' : null);
      });
  });

  const port = config.port ?? 8000;

  server.listen(port, "0.0.0.0", () => {
    console.log(
      "Bot is now listening on",
      new URL(config.endpoint ?? "", `http://localhost:${port}`).href,
    );
  });

  function shutdown() {
    server.close(() => process.exit(0));
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return server;
}

/**
 * Handles a request from Discord.
 * @param req The request from Discord
 * @param commands A list of commands or the function to run a command
 * @param components A list of components or the function to run a component
 * @param events A list of events or the function to run an event
 * @param config Configuration for your server
 * @returns The response to send back to Discord
 */
export async function handleRequest(
  req: Request,
  commands: CommandRunner | CommandData[],
  components: ComponentRunner | ComponentData[],
  events: EventRunner | EventData[],
  config?: ServerConfig,
): Promise<Response> {
  const reqLoader = ora({
    stream: stdout,
    text: "Validating new request",
  }).start();
  const body = await req.text();

  if (
    !verifySignature(
      body,
      req.headers.get("x-signature-ed25519"),
      req.headers.get("x-signature-timestamp"),
    )
  ) {
    reqLoader.fail("Invalid signature");
    return new Response(null, { status: 401 });
  }

  reqLoader.stop();

  try {
    const json = JSON.parse(body);
    let status = 500;
    // The interaction response token
    if ("token" in json) {
      status = handleInteraction(
        commands,
        components,
        json,
        config?.middleware,
      );
    } else {
      status = handleEvent(events, json, config?.middleware);
    }
    return new Response(status === 200 ? '{"type":1}' : null, {
      status,
    });
  } catch (error) {
    console.error("Failed to process request:", error);
    return new Response(null, { status: 500 });
  }
}

/**
 * Runs an interaction, takes functions to run commands/components/middleware and the request body
 */
export function handleInteraction(
  commands: CommandRunner | CommandData[],
  components: ComponentRunner | ComponentData[],
  json: ReturnType<typeof JSON.parse>,
  middleware: ServerConfig["middleware"],
): 200 | 202 | 404 {
  switch (json.type) {
    case InteractionType.Ping: {
      console.log("Received ping test");
      return 200;
    }
    case InteractionType.ApplicationCommand: {
      const command = json as APIApplicationCommandInteraction;
      const interaction = createInteraction(command);
      const runCommand =
        typeof commands === "function" ? commands : setupCommands(commands);
      runCommand(
        interaction,
        middleware?.commands as Parameters<typeof runCommand>[1],
      );
      return 202;
    }
    case InteractionType.ApplicationCommandAutocomplete: {
      const autocomplete = json as APIApplicationCommandAutocompleteInteraction;
      const interaction = createInteraction(autocomplete);
      const runCommand =
        typeof commands === "function" ? commands : setupCommands(commands);
      runCommand(interaction, undefined, "autocomplete");
      return 202;
    }
    case InteractionType.MessageComponent:
    case InteractionType.ModalSubmit: {
      const component = json as
        | APIMessageComponentInteraction
        | APIModalSubmitInteraction;
      const interaction = createInteraction(component);
      const runComponent =
        typeof components === "function"
          ? components
          : setupComponents(components);
      runComponent(interaction, middleware?.components);
      return 202;
    }
    default: {
      console.error("Received unknown interaction type:", json.type);
      return 404;
    }
  }
}

/**
 * Runs an event, takes a function to run events/middleware and the request body
 */
export function handleEvent(
  events: EventRunner | EventData[],
  json: ReturnType<typeof JSON.parse>,
  middleware: ServerConfig["middleware"],
): 200 | 202 | 404 {
  switch (json.type) {
    case ApplicationWebhookType.Ping: {
      console.log("Received ping test");
      return 200;
    }
    case ApplicationWebhookType.Event: {
      const event = json.event as APIWebhookEventBody;
      const runEvent =
        typeof events === "function" ? events : setupEvents(events);
      runEvent(event, middleware?.events);
      return 202;
    }
    default: {
      console.log("Received unknown event type:", json.type);
      return 404;
    }
  }
}
