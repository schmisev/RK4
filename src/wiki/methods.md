<p>
<img src="images/p1_outline.png" class="img-left" alt="Ein Roboter" width="100"/>

# Robotermethoden

Jeder Roboter, wie `k1` hier links, hat bestimmte Fähigkeiten. Zum Beispiel kann `k1` einen Hopps nach vorne machen, sich nach links und rechts drehen, Ziegel vor sich stapeln und unter sich Marken in verschiedenen Farben setzen.

All diese Fähigkeiten nennt man die __Methoden__ des Roboters.
</p>

Wenn man möchte, dass der Roboter etwas tut, muss man ihn "ansprechen":

> [!IMPORTANT]
> "Hey k1, mach mal einen Schritt nach vorne und lege dann links von dir einen Ziegel ab!"

... wird im Code zu ...

```RKBasic
k1.schritt()
k1.linksDrehen()
k1.hinlegen()
```

Kurz und knackig.

Probiere den Code doch mal in dieser kleinen Welt aus: <a href="./?task=wiki_Methoden_1" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Kleine Welt</a>. Aber pass auf, denn Programmiersprachen funktionieren ein bisschen anders als Deutsch oder Englisch:

> [!WARNING]
> Computer akzeptieren keine Tippfehler und können auch nicht erraten, "was du gemeint hast".
> Für einen Computer ist `k1.schritt()` __NICHT__ dasselbe wie `K1.schRitt(`.
> Du musst also präzise arbeiten!