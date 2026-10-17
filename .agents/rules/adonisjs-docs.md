---
trigger: always_on
---


---
trigger: model_decision
description: "Use the locally downloaded official AdonisJS documentation when implementing, debugging, or reviewing AdonisJS applications and related packages."
---

# AdonisJS Documentation Rule

## Local documentation

The official AdonisJS documentation has been downloaded into this workspace:

- Documentation index: `.agents/adonisjs/llms.txt`
- Full documentation: `.agents/adonisjs/llms-full.txt`

These files are local reference material. Prefer them over relying solely on model memory.

## Required workflow

1. Before making changes, inspect `package.json` and the lockfile to identify the installed AdonisJS version and relevant package versions.

2. Read `.agents/adonisjs/llms.txt` first to identify the official documentation topics relevant to the task.

3. Search `.agents/adonisjs/llms-full.txt` for the specific APIs, configuration options, documentation headings, and examples needed. Read the relevant sections rather than loading the entire file into the conversation.

4. For more targeted searches, use the IDE's file search or terminal search tools. On Windows PowerShell, `Select-String` can search the documentation file.

5. Consult the documentation before implementing or modifying:
   - Routing, controllers, middleware, and exception handling
   - Request validation and serialization
   - Authentication, authorization, and sessions
   - Lucid ORM, models, relationships, queries, and migrations
   - Dependency injection, service providers, and IoC
   - Ace commands, testing, configuration, and deployment
   - AdonisJS integrations and related official packages

6. Verify that the documented API and examples are compatible with the versions installed in this project. Do not blindly apply examples from another major version.

7. Follow existing project conventions, TypeScript types, dependencies, and architecture. Avoid introducing unnecessary packages.

8. If the local documentation does not cover the requirement, consult the official documentation website:
   `https://docs.adonisjs.com/`

9. If a relevant API cannot be verified, clearly state the uncertainty. Never invent methods, imports, configuration properties, or API behavior.

10. Before delivering a fix, check that the proposed implementation is consistent with both the applicable documentation and the existing codebase.
