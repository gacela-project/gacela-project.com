+++
title = "Factory"
template = "section.html"
+++

# Factory

The Factory's responsibility is to orchestrate the different classes and it's dependencies
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
