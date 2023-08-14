+++
title = "Home"
+++

## Gacela helps you build modular PHP applications

**VISION**: Simplify the communication of your different modules in your web application.

**MISSION**: Normalize the entry point of a module, without interfering with your domain-business logic.

Splitting your project into different modules is vital for the maintainability and scalability for your app.
It encourages your modules to interact with each other in a unified way by following these rules:

- Modules interact with each other **only** via their **Facade**
- The [**Facade**](/docs/facade) is the *entry point* of a module
- The [**Factory**](/docs/factory) manages the *intra-dependencies* of the module
- The [**DependencyProvider**](/docs/dependency-provider) resolves the *extra-dependencies* of the module
- The [**Config**](/docs/config) has access to the project's *config files*

#### Installation <small>(via [packagist](https://packagist.org/packages/gacela-project/gacela))</small>

<div id="installation-composer">
    <pre><code>composer require gacela-project/gacela</code></pre>
    <span class="button-copy-code-snippet tooltip" onclick="document.execCommand('copy')">
        <span class="tooltip-text">Copied!</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" data-view-component="true" height="24" width="24">
            <path fill-rule="evenodd" d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z"></path>
        </svg>
    </span>
</div>

### Extra Modules

- [Router](https://github.com/gacela-project/router): A minimalistic HTTP router.
- [Container](https://github.com/gacela-project/container): A minimalistic container dependency.

### Templates

- [API skeleton](https://github.com/gacela-project/api-skeleton): A skeleton to build an API using Gacela.

### Examples

You can see an example of a module using Gacela in this [repository](https://github.com/gacela-project/gacela-example).

See how Gacela works with **Symfony**, **Laravel** or [other frameworks](/docs/other-frameworks/).

## Community

We have a community forum where you can get the latest news and openly ask any of your questions to help spread the
knowledge in
the <a href="https://commercequest.space/categories/gacela-project?utm_campaign=gacela&utm_medium=website&utm_source=gacela-project" target="_blank">
commercequest.space</a>

---

> If something is still unclear, do not hesitate to write [us](/team)
> on [Twitter](https://twitter.com/gacela_project), and we will answer any questions you might have about this project.
