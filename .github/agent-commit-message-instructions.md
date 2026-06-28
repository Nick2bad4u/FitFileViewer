# Commit Message Guidelines

- Use the following commit types for all commit messages, formatted as: `👷 [build]`, `🧹 [chore]`, `📝 [docs]`, `✨ [feat]`, `🐛 [fix]`, `⚡️ [perf]`, `🚜 [refactor]`, `⏪ [revert]`, `🎨 [style]`, `🧪 [test]`

## Format Requirements

- Always start your commit message with the appropriate emoji and type in brackets
- Example: `"✨ [feat] Add dark mode toggle"`
- Create signed commits when local commit signing is configured, and verify the
  result with `git verify-commit HEAD` before reporting the commit as complete.
- Each commit bullet point should start with one of those emojis (or create a new one if none fit)
- Each new topic in the commit should start with one of the emojis and tags
- Indent any lines that refer to the statement above with `" - "`

## Content Guidelines

- **Be as detailed as possible without being excessively wordy.**
- **Prioritize source code changes above test/dev-only changes** in mixed commits.
- **List source changes first**, then tests/docs/chore updates.
- Parse changed code and explain behavior impact step by step.
- Write like a technical changelog author.
- Use relevant emojis where useful for readability, not emoji spam, but be thorough in parsing and describing all meaningful changes that match emojis above.
- Describe all meaningful changes comprehensively.

- Entire Gitmoji Table Reference below, use for ideas and consistency.

## Commitlint-enforced hybrid header format

- **Preferred header format:** `<emoji> [type] (scope) subject` (where `(scope)` is optional)
- **Also accepted:** `:shortcode: [type] (scope) subject` (where `(scope)` is optional)
- Optional punctuation after `[type]` or `[type] (scope)` is allowed (`:` and `!`), but keep headers simple unless needed.
- In actual commit headers, place `(scope)` immediately after `[type]` with no spaces.

### Allowed `[type]` values

- `[build]`, `[chore]`, `[ci]`, `[docs]`, `[feat]`, `[fix]`, `[perf]`, `[refactor]`, `[revert]`, `[style]`, `[test]`

### Valid header examples

- `✨ [feat] Add parser-service telemetry summary`
- `🛠️ [fix] (lint) Guard malformed scope parsing`
- `📝 [docs] (readme) Refresh release checklist`
- `✨ [feat] Add typed fixture inventory`

| emoji name                | emoji | description, subject, type             |
| ------------------------- | ----- | -------------------------------------- |
| art                       | 🎨    | Improve structure / format of the code |
| zap                       | ⚡️    | Improve performance                    |
| fire                      | 🔥    | Remove code or files                   |
| bug                       | 🐛    | Fix a bug                              |
| ambulance                 | 🚑️    | Critical hotfix                        |
| sparkles                  | ✨    | Introduce new features                 |
| memo                      | 📝    | Add or update documentation            |
| rocket                    | 🚀    | Deploy stuff                           |
| lipstick                  | 💄    | Add or update UI and style files       |
| artist_palette            | 🎨    | Stylistic changes                      |
| tada                      | 🎉    | Begin a project                        |
| broom                     | 🧹    | Chore                                  |
| white_check_mark          | ✅    | Fix failing tests                      |
| test_tube                 | 🧪    | Add, update, or pass tests             |
| lock                      | 🔒️    | Fix security or privacy issues         |
| closed_lock_with_key      | 🔐    | Add or update secrets                  |
| bookmark                  | 🔖    | Release / version tags                 |
| rotating_light            | 🚨    | Fix compiler / linter warnings         |
| construction              | 🚧    | Work in progress                       |
| green_heart               | 💚    | Fix CI build                           |
| arrow_down                | ⬇️    | Downgrade dependencies                 |
| arrow_up                  | ⬆️    | Upgrade dependencies                   |
| pushpin                   | 📌    | Pin dependencies to specific versions  |
| construction_worker       | 👷    | Add or update CI build system          |
| chart_with_upwards_trend  | 📈    | Add/update analytics                   |
| recycle                   | ♻️    | Refactor code                          |
| tractor                   | 🚜    | Refactor code                          |
| heavy_plus_sign           | ➕    | Add a dependency                       |
| heavy_minus_sign          | ➖    | Remove a dependency                    |
| wrench                    | 🔧    | Add or update configuration files      |
| hammer                    | 🔨    | Add or update development scripts      |
| globe_with_meridians      | 🌐    | Internationalization/localization      |
| pencil2                   | ✏️    | Fix typos                              |
| poop                      | 💩    | Write bad code that needs improvement  |
| rewind                    | ⏪️    | Revert changes                         |
| twisted_rightwards_arrows | 🔀    | Merge branches                         |
| package                   | 📦️    | Add/update compiled files or packages  |
| alien                     | 👽️    | Update for external API changes        |
| truck                     | 🚚    | Move/rename resources                  |
| page_facing_up            | 📄    | Add or update license                  |
| boom                      | 💥    | Introduce breaking changes             |
| bento                     | 🍱    | Add or update assets                   |
| wheelchair                | ♿️    | Improve accessibility                  |
| bulb                      | 💡    | Add or update source comments          |
| beers                     | 🍻    | Write code drunkenly                   |
| speech_balloon            | 💬    | Add or update text/literals            |
| card_file_box             | 🗃️    | Database-related changes               |
| loud_sound                | 🔊    | Add or update logs                     |
| mute                      | 🔇    | Remove logs                            |
| busts_in_silhouette       | 👥    | Add or update contributor(s)           |
| children_crossing         | 🚸    | Improve UX/usability                   |
| building_construction     | 🏗️    | Architectural changes                  |
| iphone                    | 📱    | Responsive design work                 |
| clown_face                | 🤡    | Mock things                            |
| egg                       | 🥚    | Add or update easter egg               |
| see_no_evil               | 🙈    | Add or update a .gitignore file        |
| camera_flash              | 📸    | Add or update snapshots                |
| alembic                   | ⚗️    | Perform experiments                    |
| mag                       | 🔍️    | Improve SEO                            |
| label                     | 🏷️    | Add or update types                    |
| seedling                  | 🌱    | Add or update seed files               |
| triangular_flag_on_post   | 🚩    | Add/update/remove feature flags        |
| goal_net                  | 🥅    | Catch errors                           |
| dizzy                     | 💫    | Add/update animations/transitions      |
| wastebasket               | 🗑️    | Deprecate code for later cleanup       |
| passport_control          | 🛂    | Authorization/roles/permissions work   |
| adhesive_bandage          | 🩹    | Simple non-critical fix                |
| monocle_face              | 🧐    | Data exploration/inspection            |
| coffin                    | ⚰️    | Remove dead code                       |
| test_tube                 | 🧪    | Add a failing test                     |
| necktie                   | 👔    | Add or update business logic           |
| stethoscope               | 🩺    | Add or update healthcheck              |
| bricks                    | 🧱    | Infrastructure-related changes         |
| technologist              | 🧑‍💻    | Improve developer experience           |
| money_with_wings          | 💸    | Sponsorship/money infrastructure       |
| thread                    | 🧵    | Multithreading/concurrency changes     |
| safety_vest               | 🦺    | Validation-related changes             |
| airplane                  | ✈️    | Improve offline support                |
| t-rex                     | 🦖    | Add backwards compatibility code       |
