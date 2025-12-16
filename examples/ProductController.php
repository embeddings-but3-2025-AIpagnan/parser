<?php

class ProductController {
    private $database;
    private $cache;
    
    public function __construct($database, $cache) {
        $this->database = $database;
        $this->cache = $cache;
    }
    
    public function getProduct($productId) {
        $cacheKey = "product_" . $productId;
        $product = $this->cache->get($cacheKey);
        return $product;
    }
}

?>