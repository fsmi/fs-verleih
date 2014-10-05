<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$dbpath = "verleih.db3";
main();

class STATES {

    const INCOMING = 1;
    const ACCEPTED = 2;
    const OUT = 3;
    const FINISHED = 4;
    const REJECTED = -1;

}

function main() {
    global $db, $output, $contact;

    // init
    $output = Output::getInstance();
    $db = new DB();
    $lists = new Lists();
    $stuff = new Stuff();
    $event = new Event();
    $contact = new Contact();

    // db connection
    if (!$db->connect()) {
	header("WWW-Authenticate: Basic realm=\"Garfield API Access (Invalid Credentials for " . $_SERVER['PHP_AUTH_USER'] . ")\"");
	header("HTTP/1.0 401 Unauthorized");

	die();
    }
    /*
      if (isset($_GET["save"])) {
      $output->addStatus("debug", "save");
      $http_raw = file_get_contents("php://input");

      if (isset($http_raw) && !empty($http_raw)) {
      $input = json_decode($http_raw, true);
      $cart->save($input);
      }
      }
     */
    $http_raw = file_get_contents("php://input");

    if (isset($_GET["events"])) {
	$lists->events();
    } else if (isset($_GET["stuff"])) {
	$lists->stuff();
    } else if (isset($_GET["details"])) {
	$lists->details();
    } else if (isset($_GET["stufflist"])) {
	$lists->stuffList();
    } else if (isset($_GET["stuffdetail"])) {
	$lists->stuffDetail();
    } else if (isset($_GET["stuffinfo"])) {
	$lists->stuffInfo();
    } else if (isset($_GET["get-stuff"])) {
	if (!empty($_GET["get-stuff"])) {
	    $stuff->getByName($_GET["get-stuff"]);
	} else {
	    $stuff->getAll();
	}
    }

    if (isset($http_raw) && !empty($http_raw)) {

	$obj = json_decode($http_raw, true);
	if (isset($_GET["allow-event"])) {
	    $event->allow($obj);
	} else if (isset($_GET["reject-event"])) {
	    $event->reject($obj);
	} else if (isset($_GET["out-event"])) {
	    $event->out($obj);
	} else if (isset($_GET["finish-event"])) {
	    $event->finish($obj);
	}
	if (isset($_GET["add-material"])) {
	    $stuff->add($obj);
	} else if (isset($_GET["delete-material"])) {
	    $stuff->delete($obj);
	}
	if (isset($_GET["add-event"])) {
	    $event->add($obj);
	}
    }

    $output->write();
}

class Contact {

    public function genToken() {
	return uniqid('', true);
    }

}

class Stuff {

    public function add($object) {
	global $db, $output;

	$output->add("stuffBack", $object);

	$sql = "INSERT INTO stuff (name, intern_price, extern_price, count) "
		. "VALUES(:name, :intern_price, :extern_price, :count)";

	$param = array(
	    ':name' => $stuff['name'],
	    ':intern_price' => $stuff['intern_price'],
	    ':extern_price' => $stuff['extern_price'],
	    ':count' => $stuff['count']);

	$db->beginTransaction();

	$stmt = $db->query($sql, $param);

	$id = $db->lastInsertID();
	$output->addStatus("add-stuff", $stmt->errorInfo());

	foreach ($stuff['infos'] as $info) {
	    $sql = "INSERT INTO stuff_infos(key, value, type, stuff) VALUES(:key, :value, :type, :stuff)";

	    $param = array(
		':key' => $info['key'],
		':value' => $info['value'],
		':type' => $info['type'],
		':stuff' => $id
	    );

	    $stmt = $db->query($sql, $param);

	    $output->addStatus("add-stuff-info", $stmt->errorInfo());
	}
	$db->commit();
    }

    public function delete($object) {
	global $db, $output;

	if (!isset($object["id"]) || empty($object["id"])) {
	    $output->addStatus("delete-stuff", "No ID set!");
	    return;
	}

	$sql = "DELETE FROM stuff WHERE id = :id";

	$param = array(
	    ":id" => $object["id"]
	);

	$stmt = $db->query($sql, $param);

	$output->addStatus("delete-stuff", $stmt->errorInfo());
    }
    
    public function getByName($name) {
	global $db, $output;
	
	$sql = "SELECT * FROM stuff WHERE name = :name";
	
	$param = array(
	    ":name" => $name
	);
	
	$stmt = $db->query($sql, $param);
	
	$output->addStatus("stuff", $stmt->errorInfo());
	$output->add("stuff", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    
    public function getAll() {
	global $db, $output;
	
	$sql = "SELECT * FROM stuff";
	
	$param = array();
	
	$stmt = $db->query($sql, $param);
	
	$output->addStatus("stuff", $stmt->errorInfo());
	$output->add("stuff", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

}

class Lists {

    function events() {
	global $db, $output;

	$sql = "SELECT * FROM events ORDER BY start ASC";

	$param = array();

	$stmt = $db->query($sql, $param);

	$output->add("events", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function stuffList() {
	global $db, $output;

	$sql = "SELECT * FROM stuff";

	$param = array();

	$stmt = $db->query($sql, $param);

	$output->add("stufflist", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function stuffInfo() {
	global $db, $output;

	$id = $_GET['id'];

	$param = array();

	if (isset($id) && !empty($id)) {
	    $sql = "SELECT * FROM stuff_infos WHERE stuff = :id";
	    $param[':id'] = $id;
	} else {
	    return;
	}

	$stmt = $db->query($sql, $param);

	$output->add("stuffinfo", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function stuffDetail() {
	global $db, $output;

	$id = $_GET['id'];

	$param = array();

	if (isset($id) && !empty($id)) {
	    $sql = "SELECT * FROM stuff WHERE id = :id";
	    $param[':id'] = $id;
	} else {
	    return;
	}

	$stmt = $db->query($sql, $param);

	$output->add("stuffdetail", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function details() {
	global $db, $output;

	$id = $_GET['id'];

	$param = array();

	if (isset($id) && !empty($id)) {
	    $sql = "SELECT * FROM events "
		    . "WHERE id = :id";
	    $param[':id'] = $id;
	} else {
	    return;
	}

	$stmt = $db->query($sql, $param);

	$output->add("details", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function stuff() {
	global $db, $output;

	$id = $_GET['id'];

	$param = array();

	if (isset($id) && !empty($id)) {
	    $sql = "SELECT id, name, COUNT(name) AS count, event, intern_price, extern_price"
		    . " FROM stuff JOIN event_stuff ON (stuff.id = event_stuff.stuff) WHERE event_stuff.event = :event GROUP BY name";
	    $param[':event'] = $id;
	} else {
	    $sql = "SELECT id, name, count, event, intern_price, extern_price FROM stuff JOIN event_stuff ON (stuff.id = event_stuff.stuff)";
	}


	$stmt = $db->query($sql, $param);

	$output->add("stuff", $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

}

class Event {

    public function allow($obj) {
	global $db, $output;
	if (!isset($obj["id"]) || empty($obj["id"])) {
	    $output->addStatus("allow-event", "No ID is set!");
	    return;
	}
	$output->addStatus("allow-event", $this->updateState(
			$obj["id"], STATES::ACCEPTED));
    }

    public function reject($obj) {
	global $output;
	if (!isset($obj["id"]) || empty($obj["id"])) {
	    $output->addStatus("reject-event", "No ID is set!");
	    return;
	}

	$output->addStatus("reject-event", $this->updateState(
			$obj["id"], STATES::REJECTED));
    }

    public function out($obj) {
	global $output;
	if (!isset($obj["id"]) || empty($obj["id"])) {
	    $output->addStatus("out-event", "No ID is set!");
	    return;
	}

	$output->addStatus("out-event", $this->updateState(
			$obj["id"], STATES::OUT));
    }

    public function finish($obj) {
	global $output;
	if (!isset($obj["id"]) || empty($obj["id"])) {
	    $output->addStatus("finish-event", "No ID is set!");
	    return;
	}

	$output->addStatus("finish-event", $this->updateState(
			$obj["id"], STATES::FINISHED));
    }

    public function updateState($id, $state) {
	global $db;
	$sql = "UPDATE event SET state = :state WHERE id = :id";

	$param = array(
	    ":id" => $id,
	    ":state" => $state,
	);

	if ($state != -1) {
	    $sql .= " AND state = :current";
	    $param[":current"] = ($state - 1);
	}

	$stmt = $db->query($sql, $param);

	return $stmt->errorInfo();
    }

    public function add($obj) {
	global $db, $output, $contact;

	// check for contact token
	if (isset($obj["contact_token"]) && !empty($obj["contact_token"])) {
	    $getsql = "SELECT id FROM contact WHERE token = :token";
	    
	    $getparam = array(
		":token" => $obj["contact_token"]
	    );
	    
	    $stmt = $db->query($getsql, $getparam);
	    
	    if ($stmt->errorCode() != 0) {
		return;
	    }
	    
	    
	} else {
	    // create contact
	    $contactsql = "INSERT INTO contact(name, token) "
		    . "VALUES(:name, :token)";

	    $contactToken = $contact->genToken();
	    $output->add('contact_token', $contactToken);

	    $contactparam = array(
		":name" => $obj["contact"]["name"],
		":token" => $contactToken
	    );

	    $db->beginTransaction();

	    $stmt = $db->query($contactsql, $contactparam);

	    $output->addStatus("add-contact", $stmt->errorInfo());

	    if ($stmt->errorCode() != 0) {
		$stmt->rollback();
		return;
	    }

	    $contactID = $db->lastInsertID();

	    $detailsql = "INSERT INTO contact_infos(key, value, contact) "
		    . "VALUES(:key, :value, :contact)";

	    foreach ($obj["contact"]["details"] as $detail) {
		$detailparam = array(
		    ":key" => $detail["key"],
		    ":value" => $detail["value"],
		    ":contact" => $contactID
		);

		$stmt = $db->query($detailsql, $detailparam);


		if ($stmt->errorCode != 0) {
		    $output->addStatus("add-detail", $stmt->errorInfo());

		    $db->rollback();
		    return;
		}
	    }
	}

	// insert event
	$eventsql = "INSERT INTO event "
		. "(contact, state, start, end, fscontact, comment, name) "
		. "VALUES(:contact, :state, :start, :end, :fscontact, :comment, :name)";

	$eventparam = array(
	    ":contact" => $contactID,
	    ":state" => 1,
	    ":start" => $obj["event"]["start"],
	    ":end" => $obj["event"]["end"],
	    ":fscontact" => $obj["event"]["fscontact"],
	    ":comment" => $obj["event"]["comment"],
	    ":name" => $obj["event"]["name"]
	);

	$stmt = $db->query($eventsql, $eventparam);

	$output->addStatus("add-event", $stmt->errorInfo());

	if ($stmt->errorCode() != 0) {
	    $db->rollback();
	    return;
	}


	$eventid = $db->lastInsertID();

	// insert event stuff
	$stuffsql = "INSERT INTO event_stuff(event, stuff) VALUES(:event, :stuff)";

	foreach ($obj["event"]["stuff"] as $stuff) {

	    $stuffparam = array(
		":event" => $eventid,
		":stuff" => $stuff["id"]
	    );

	    $stmt = $db->query($stuffsql, $stuffparam);

	    if ($stmt->errorCode() != 0) {
		$output->addStatus("add-event_stuff", $stmt->errorInfo());
		$db->rollback();
		return;
	    }
	}

	$db->commit();
    }

}

class DB {

    private $db;
    private $order = "";

    function connect() {
	global $dbpath;

	try {
	    $this->db = new PDO('sqlite:' . $dbpath);
	    $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
	} catch (PDOException $e) {

	    header("Status: 500 " . $e->getMessage());
	    echo $e->getMessage();
	    die();
	}

	return true;
    }

    function setOrder($tag, $order) {
	$this->order = " ORDER BY " . $tag . " " . $order;
    }

    function query($sql, $params) {
	global $output, $orderBy;

	if (strpos($sql, "SELECT") !== false) {

	    $sql .= $this->order;

	    if (isset($_GET["limit"]) && !empty($_GET["limit"])) {
		$sql .= " LIMIT :limit";
		$params[":limit"] = $_GET["limit"];
	    }
	}

	$stm = $this->db->prepare($sql);

	if ($this->db->errorCode() > 0) {
	    $output->addStatus("db", $this->db->errorInfo());
	    return null;
	}

	$stm->execute($params);


	return $stm;
    }

    function beginTransaction() {
	global $output;
	if (!$this->db->beginTransaction()) {
	    $output->addStatus("transaction", $this->db->errorInfo());
	}
    }

    function commit() {
	global $output;
	if (!$this->db->commit()) {
	    $output->addStatus("commit", $this->db->errorInfo());
	}
    }

    function rollback() {
	$this->db->rollback();
    }

    function lastInsertID() {
	return $this->db->lastInsertId();
    }

}

/**
 * output functions
 */
class Output {

    private static $instance;
    public $retVal;

    /**
     * constructor
     */
    private function __construct() {
	$this->retVal['status']["db"] = "ok";
    }

    /**
     * Returns the output instance or creates it.
     * @return Output output instance
     */
    public static function getInstance() {
	if (!self::$instance) {
	    self::$instance = new self();
	}

	return self::$instance;
    }

    /**
     * Adds data for use to output.
     * @param type $table
     * @param type $output
     */
    public function add($table, $output) {
	$this->retVal[$table] = $output;
    }

    /**
     * Adds an status for output
     * @param type $table status table
     * @param type $output message (use an array with 3 entries ("id", <code>, <message>))
     */
    public function addStatus($table, $output) {

	if (is_array($output) && $output[1]) {
	    if (is_array($retVal["status"]["debug"])) {
		$this->retVal["status"]["debug"][] = $output;
	    } else {
		$retVal["status"]["debug"] = array($output);
	    }
	    $this->retVal["status"]["db"] = "failed";
	}

	$this->retVal['status'][$table] = $output;
    }

    /**
     * Generates the output for the browser. General you call this only once.
     */
    public function write() {

	header("Content-Type: application/json");
	header("Access-Control-Allow-Origin: *");
	# Rückmeldung senden
	if (isset($_GET["callback"]) && !empty($_GET["callback"])) {
	    $callback = $_GET["callback"];
	    echo $callback . "('" . json_encode($this->retVal, JSON_NUMERIC_CHECK) . "')";
	} else {
	    echo json_encode($this->retVal, JSON_NUMERIC_CHECK);
	}
    }

}
