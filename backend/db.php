<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$dbpath = "verleih.db3";
main();

function main() {
    global $db, $output;

    // init
    $output = Output::getInstance();
    $db = new DB();
    $lists = new Lists();
    $stuff = new Stuff();
    
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
    }
    else if (isset($_GET["stuff"])) {
	$lists->stuff();
    } else if (isset($_GET["details"])) {
	$lists->details();
    } else if (isset($_GET["stufflist"])) {
	$lists->stuffList();
    } else if (isset($_GET["stuffdetail"])) {
	$lists->stuffDetail();
    } else if (isset($_GET["stuffinfo"])) {
	$lists->stuffInfo();
    } else if (isset($_GET["add-material"])) {
	if (isset($http_raw) && !empty($http_raw)) {
	    $stuff->add($http_raw);
	}
    }

    $output->write();
}

class Stuff {
    
    public function add($object) {
	global $db, $output;
	
	$stuff = json_decode($object, true);
	$output->add("stuffBack", $stuff);
	
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
}

class Lists {
    
    function events() {
	global $db, $output;
	
	$sql = "SELECT event.id, contact.name AS contact, states.name AS state, start, end, fscontact, comment, group_concat(stuff.name) AS stuff"
		. " FROM event "
		. "JOIN contact "
		. "ON (event.contact = contact.id) "
		. "JOIN states "
		. "ON (event.state = states.id) "
		. "LEFT JOIN event_stuff "
		. "ON (event.id = event_stuff.event) "
		. "LEFT JOIN stuff "
		. "ON (event_stuff.stuff = stuff.id) "
		. "ORDER BY start ASC";
	
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
	 $sql = "SELECT event.name, event.id, contact.name AS contact, states.name AS state, start, end, fscontact, comment"
		. " FROM event "
		. "JOIN contact "
		. "ON (event.contact = contact.id) "
		. "JOIN states "
		. "ON (event.state = states.id)"
		 . "WHERE event.id = :id";
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
