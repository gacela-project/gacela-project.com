+++
title = "Home"
+++

## Build a modular PHP application with Gacela

#### Gacela helps you to split the logic of your app into different modules

Splitting your project into different modules will help its design in
terms of maintainability and scalability. It will certainly encourage your modules to interact with each
other in a unified way by
following these rules:

- Modules interact with each other **only** via their _Facade_.
- The [Facade](/docs/facade) has access to the _Factory_.
- The [Factory](/docs/factory) creates the module's objects.
- The [Config](/docs/config) is accessible from the _Factory_.
- The [DependencyProvider](/docs/dependency-provider) gets other _Facades_.

### Installation

<div id="installation-composer">
    <pre><code>composer require gacela-project/gacela</code></pre>
    <span class="button-copy-code-snippet tooltip" onclick="document.execCommand('copy')">
        <span class="tooltip-text">Copied!</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" data-view-component="true" height="24" width="24">
            <path fill-rule="evenodd" d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z"></path>
        </svg>
    </span>
</div>

### Examples

You can see an example of a module using gacela in this [repository](https://github.com/gacela-project/gacela-example).
