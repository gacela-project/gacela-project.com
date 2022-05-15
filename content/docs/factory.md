+++
title = "Factory"
weight = 4
+++

The responsibility of the [Factory](https://en.wikipedia.org/wiki/Factory_(object-oriented_programming)) is to
orchestrate the creation of different classes, and it's dependencies (through DependencyProvider or Config).

- The Factory creates the classes of your module and its dependencies.
- The Factory is accessible to the Facade (with `getFactory()`).

## Creating your objects

The Factory is the place where you create your domain services and objects. It is accessible only by the Facade.

Full code snippet: [gacela-example/comment-spam-score/factory](https://github.com/gacela-project/gacela-example/blob/master/comment-spam-score/src/Comment/CommentFactory.php)

```php
<?php # src/Comment/CommentFactory.php

namespace App\Comment;

use App\Comment\Domain\SpamChecker;
use Gacela\Framework\AbstractFactory;
use Symfony\Contracts\HttpClient\HttpClient;

/**
 * @method CommentConfig getConfig()
 */
final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return new SpamChecker(
            HttpClient::create(),
            $this->getConfig()->getSpamCheckerEndpoint()
        );
    }    
}
```

```php
<?php # src/Comment/Domain/SpamChecker.php

namespace App\Comment\Domain;

use Symfony\Contracts\HttpClient\HttpClientInterface;

final class SpamChecker
{
    public function __construct(
        private HttpClientInterface $client,
        private string $endpoint
    ) {}

    public function getSpamScore(string $comment): int
    {
        // your business logic
        return $x;
    }
}
```

## Auto-wiring dependencies into the Factory

Gacela can resolve automatically the dependencies for the Factory. If the dependency is a concrete class it will create
a new instance of it - recursively with their inner dependencies as well. But, if the dependency is an interface, then
the way to tell Gacela which instance do you want to create you need to create a map between the interface and the
concrete class or object that you want to use. For example:
```php
<?php # gacela.php

return function (GacelaConfig $config) {
    $config->addMappingInterface(
        InterfaceToConcreteClass::class,
        ConcreteClass::class
    );

    $config->addMappingInterface(
        InterfaceToCallable::class, 
        fn () => new ConcreteClass()
    );
};
```

The major difference between these two are:

- the `InterfaceToConcreteClass` will be resolved by creating an instance of that `ConcreteClass` on the fly (even using
  auto-wiring for its dependencies recursively if needed).
- the `InterfaceToCallable` won't create a new instance, but instead it will use the instance that you might want to.
- using a callable as value (the `fn () => ...`) is also a "lazy loading", so it will delay the execution of that code
  till its needed.

Real example: [symfony-gacela-example/gacela.php](https://github.com/gacela-project/symfony-gacela-example/blob/master/gacela.php#L28)

### Injecting external services to Gacela config

You can let know Gacela the external services that you want to have access in your `gacela.php` config file
by passing them in the entry point of your app:
```php
<?php # public/index.php
namespace Symfony\Component\HttpKernel\Kernel;
# A real example for a Symfony application ...
$kernel = new Kernel($_SERVER['APP_ENV']);

$configFn = fn (GacelaConfig $config) => $config
    ->addExternalService('symfony/kernel', $kernel);

Gacela::bootstrap($appRootDir, $configFn);
```

You have access now to the external services (in this case the symfony kernel), so you can map the 
`EntityManagerInterface` to the one that the `symfony.kernel.container` itself already created:
```php
<?php # gacela.php

use Gacela\Framework\AbstractConfigGacela;

return function (GacelaConfig $config) {
    /** 
     * Using $config we can get the service that we added in `public/index.php`
     * 
     * @var Kernel $kernel
     */
    $kernel = $config->getExternalService('symfony/kernel');

    $config->addMappingInterface(
        EntityManagerInterface::class,
        fn () => $kernel->getContainer()->get('doctrine.orm.entity_manager')
    );
});
```

To see the complete example, please check out [this repository](https://github.com/gacela-project/symfony-gacela-example).
