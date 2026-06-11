<?php
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

require dirname(__DIR__) . '/vendor/autoload.php';

class Chat implements MessageComponentInterface {
  protected $clients;

  public function __construct() {
    $this->clients = new \SplObjectStorage;
  }

  public function onOpen(ConnectionInterface $conn) {
    $this->clients->attach($conn);
    echo "New connection! ({$conn->resourceId})\n";
  }

  public function onMessage(ConnectionInterface $from, $msg) {
  $data = json_decode($msg, true);
  foreach ($this->clients as $client) {
    if ($from !== $client) {
      if ($data['type'] === "private_invite") {
        if ($client->session->getUserId() === $data['to_user_id']) {
          $client->send($msg);
        }
      } else {
        $client->send($msg);
      }
    }
  }
}

  public function onClose(ConnectionInterface $conn) {
    $this->clients->detach($conn);
    echo "Connection {$conn->resourceId} has disconnected\n";
  }

  public function onError(ConnectionInterface $conn, \Exception $e) {
    echo "An error has occurred: {$e->getMessage()}\n";
    $conn->close();
  }
}

$server = \Ratchet\Server\IoServer::factory(
  new \Ratchet\Http\HttpServer(
    new \Ratchet\WebSocket\WsServer(
      new Chat()
    )
  ),
  8080
);

$server->run();