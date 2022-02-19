+++
title = "Factory"
weight = 3
+++

The Factory's responsibility is to orchestrate the different classes, and it's dependencies
(through Dependency Provider or Config).

The Factory class creates the classes of your logic and its dependencies.
They are provided to the Facade. It's a layer between the user and your domain.

## Creating your objects

The Factory is the place where you create your domain services and objects. It is accessible only by the Facade.

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
        $response = $this->client->request(
            'POST', 
            $this->endPoint, 
            [
                'body' => [
                   'comment_content' => $comment
                ]
            ]
        );
        
        $content = $response->getContent();
        
        return ('true' === $content) ? 1 : 0;
    }
}
```

## Autowiring dependencies into the Factory

Gacela can resolve automagically the dependencies for the Factory. If the dependency is a concrete class it will create
a new instance of it - recursively with their inner dependencies as well. But, if the dependency is an interface, then
the way to tell Gacela which instance do you want to create you need to create a map between the interface and the
concrete class or object that you want to use.

This map will be created in the `gacela.php` config file. For example
```php
<?php # gacela.php

use Gacela\Framework\AbstractConfigGacela;

return static fn () => new class() extends AbstractConfigGacela {
    public function mappingInterfaces(array $globalServices): array
    {
        return [
            InterfaceToConcreteClass::class => ConcreteClass::class,
            InterfaceToCallable::class => fn () => new ConcreteClass(/**/),
        ];
    }
};
```

The major difference between these two are

- the `InterfaceToConcreteClass` will be resolved by creating an instance of that `ConcreteClass` on the fly (even using
  auto-wiring for its dependencies recursively if needed).
- the `InterfaceToCallable` won't create a new instance, but instead it will use the instance that you might want to.

### Injecting global services to Gacela config

You can let know Gacela the global services that you want to have access in your `gacela.php` config file
by passing them in the entry point of your app:
```php
<?php # public/index.php
# A real example for a Symfony application
$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);

Gacela::bootstrap(
    appRootDir: __DIR__,
    globalServices: ['symfony/kernel' => $kernel]
);
```

this way you have access now to the global services, in this case the symfony kernel, so you
can map the EntityManagerInterface to the one that the `symfony.kernel.container` itself already created:
```php
<?php # gacela.php

use Gacela\Framework\AbstractConfigGacela;

return static fn () => new class() extends AbstractConfigGacela {
    public function mappingInterfaces(array $globalServices): array
    {
        /** @var Kernel $kernel */
        $kernel = $globalServices['symfony/kernel'];

        return [
            EntityManagerInterface::class => static fn() => $kernel
                ->getContainer()
                ->get('doctrine.orm.entity_manager'),
        ];
    }
};
```

To see the complete example, please check out [this repository](https://github.com/gacela-project/symfony-gacela-example).
