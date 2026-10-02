<?php
require_once __DIR__ . '/../lib.php';
start_session();
unset($_SESSION['admin_id'], $_SESSION['admin_name']);
session_regenerate_id(true);
header('Location: login.php');
