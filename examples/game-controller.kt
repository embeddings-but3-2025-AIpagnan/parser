package com.example

class GameController(private val player: Player) {
    private var score: Int = 0
    private var level: Int = 1
    
    fun startGame() {
        score = 0
        level = 1
    }
    
    fun increaseScore(points: Int) {
        score += points
        checkLevelUp()
    }
    
    private fun checkLevelUp() {
        if (score >= level * 100) {
            level++
        }
    }
}

data class Player(val name: String, val id: Int)

fun createPlayer(name: String, id: Int): Player {
    return Player(name, id)
}