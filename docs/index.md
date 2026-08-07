---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Gacela"
  text: "Build modular PHP applications"
  tagline: Gacela 2.0 · PHP 8.3+. Split your application into modules that talk through one door. Everything behind it stays private.
  actions:
    - theme: brand
      text: Quickstart
      link: /docs/quickstart
    - theme: alt
      text: About Gacela
      link: /about-gacela
    - theme: alt
      text: Why decoupling?
      link: /about-gacela#why-decoupling
---

<section class="gz-section">
  <p class="gz-eyebrow">Core concepts</p>
  <h2>The anatomy of a module</h2>
  <p class="gz-lede">Every module exposes the same four classes, so any module in any Gacela project reads the same way. Other modules only ever call the Facade.</p>
  <div class="gz-anatomy-grid">
    <a class="gz-anatomy-card" href="/docs/facade">
      <span class="gz-anatomy-file">Facade.php</span>
      <h3>Facade</h3>
      <p>The entry point of the module, and the only class other modules call.</p>
    </a>
    <a class="gz-anatomy-card" href="/docs/factory">
      <span class="gz-anatomy-file">Factory.php</span>
      <h3>Factory</h3>
      <p>Creates the module's internal services and wires its intra-dependencies.</p>
    </a>
    <a class="gz-anatomy-card" href="/docs/provider">
      <span class="gz-anatomy-file">Provider.php</span>
      <h3>Provider</h3>
      <p>Resolves what the module needs from outside: its extra-dependencies.</p>
    </a>
    <a class="gz-anatomy-card" href="/docs/config">
      <span class="gz-anatomy-file">Config.php</span>
      <h3>Config</h3>
      <p>Reads the project's config files from one predictable place.</p>
    </a>
  </div>
</section>

<section class="gz-section gz-code">
  <p class="gz-eyebrow">Quickstart</p>
  <h2>A module in three files</h2>
  <p class="gz-lede">This is the whole ceremony: a Facade in front, a Factory wiring a service behind it, and one bootstrap call at your entry point. The Facade resolves its sibling Factory automatically.</p>

::: code-group

```php [example.php]
use Gacela\Framework\Gacela;
use Module\Facade;

require __DIR__ . '/vendor/autoload.php';

Gacela::bootstrap(__DIR__);

$facade = new Facade();
echo $facade->greet('Alice'); # Hi, Alice!
```

```php [Facade.php]
namespace Module;

use Gacela\Framework\AbstractFacade;

/**
 * @method Factory getFactory()
 */
final class Facade extends AbstractFacade
{
    public function greet(string $name): string
    {
        return $this->getFactory()
            ->createGreeter()
            ->greet($name);
    }
}
```

```php [Factory.php]
namespace Module;

use Gacela\Framework\AbstractFactory;
use Module\Service\Greeter;

final class Factory extends AbstractFactory
{
    public function createGreeter(): Greeter
    {
        return new Greeter();
    }
}
```

```php [Greeter.php]
namespace Module\Service;

final class Greeter
{
    public function greet(string $name): string
    {
        return "Hi, $name!";
    }
}
```

:::

</section>

<section class="gz-section">
  <p class="gz-eyebrow">Features</p>
  <h2>Beyond the basics</h2>
  <div class="gz-more-grid">
    <a class="gz-more-item" href="/docs/bindings#factory-services">
      <strong>Container DI</strong>
      <span>Bindings, tags, hooks, definitions, scopes &amp; lazy services</span>
    </a>
    <a class="gz-more-item" href="/docs/caching">
      <strong>Caching</strong>
      <span>Three layers: framework resolution, cacheable methods, file cache</span>
    </a>
    <a class="gz-more-item" href="/docs/gacela-script">
      <strong>Tooling</strong>
      <span>cache:warm, doctor, debug:module, debug:graph, profile:report</span>
    </a>
    <a class="gz-more-item" href="/docs/events">
      <strong>Lifecycle events</strong>
      <span>Zero-cost bootstrap, config, container &amp; cache events for tracing</span>
    </a>
    <a class="gz-more-item" href="/docs/health-checks">
      <strong>Health checks</strong>
      <span>Per-module status for the doctor CLI and HTTP endpoints</span>
    </a>
    <a class="gz-more-item" href="/docs/inject">
      <strong>Inject attribute</strong>
      <span>#[Inject] on constructors, properties and setters</span>
    </a>
    <a class="gz-more-item" href="/docs/provider#provides-attribute">
      <strong>Provides attribute</strong>
      <span>Declarative #[Provides] for provider service registration</span>
    </a>
    <a class="gz-more-item" href="/docs/testing">
      <strong>Testing</strong>
      <span>GacelaTestCase: bootstrap isolation and event-backed assertions</span>
    </a>
  </div>
</section>

<section class="gz-section gz-cta">
  <p class="gz-eyebrow">Get started</p>
  <h2>Start your first module</h2>

```bash
composer require gacela-project/gacela:^2.0
```

  <p class="gz-cta-links"><a href="/docs/quickstart">Read the quickstart</a> · <a href="/docs/upgrading">Upgrade from 1.21</a> · <a href="/used-in">See who uses Gacela</a></p>
</section>
