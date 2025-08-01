# Interactions

All interaction types share a set of core response methods. Additional methods are available for specific interaction types.

## Base methods

These methods are available on all interactions:

1. **Reply**

   Sends an immediate response to the interaction.

   #### Parameters
   - `data`: The message content or options.

   ```ts
   await interaction.reply({ content: "Hello!", ephemeral: true });
   ```

2. **Defer Reply**  
   Acknowledges the interaction, showing a "thinking..." indicator to the user, with an option to edit or respond later.

   #### Parameters
   - `data` (optional): Options for deferral, such as whether it's ephemeral:

   ```ts
   await interaction.deferReply({ ephemeral: true });
   ```

3. **Edit Reply**  
   Edits the initial response to the interaction.

   #### Parameters
   - `data`: The updated message content or options.

   ```ts
   await interaction.editReply("Updated message content");
   ```

4. **Follow Up**  
   Sends an additional message related to the interaction.

   #### Parameters
   - `data`: The follow-up message content or options.

   ```ts
   await interaction.followUp({
     content: "Another message!",
     ephemeral: true,
   });
   ```

5. **Show Modal**  
    Responds with a modal dialog. This is not available on modal submission interactions.

   #### Parameters
   - `data`: Modal data, including components and title.

   ```ts
   await interaction.showModal({
    title: "Example Modal",
    custom_id: "modal_id",
    components: [...],
   });
   ```

---

## Command interactions

This method is only available for command interactions

### getOption

Retrieves an option value from the command.

#### Parameters

- `name`: Name of the option.
- `required`: If true, throws an error if the option is not present.

```ts
const user = interaction.getOption("user", true).user();
```

---

## Message component interactions

This method is only available for components

### update

Edits the original message containing the component.

#### Parameters

- `data`: New content or message options.

```ts
await interaction.update("Updated content");
```

---

## Modal submit interactions

This method is only available for modal responses

### getField

Retrieves a field value from the modal submission.

#### Parameters

- `name`: Name of the field.
- `required`: If true, throws an error if the field is not present.

```ts
const fieldValue = interaction.getField("input_name", true);
```
