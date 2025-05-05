<img src="images/world_example.png" class="img-left img-black" alt="Eine Welt" width="200"/>

# Die Welt

In einer Welt wie dieser gibt es meistens eine Aufgabe zu erledigen.

Hier soll `k1` z.B. die gelbe Marke entfernen (deshalb das X) und dahinter einen roten Ziegel platzieren (der schwebende Ziegel zeigt, wo).

## welt.fertig()

Um herauszufinden, ob einer Aufgabe erfolgreich abgeschlossen wurde, kann man `welt.fertig()` ausführen. Wenn der Rückgabewert `wahr` ist, ist die Aufgabe abgeschlossen, wenn `falsch`, dann nicht.

In dieser <a href="./?task=wiki_Welt_1" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Welt</a> muss man eine zufällige Anzahl von Blöcken in einer Reihe legen. Da man die genaue Anzahl aber nicht von Anfang an weiß, muss man die Welt nach jedem gelegten Ziegel fragen, ob die Aufgabe abgeschlossen ist.

```RKBasic
wiederhole solange nicht welt.fertig()
  k1.hinlegen()
  k1.schritt()
ende
```

## welt.teilaufgabe()

Hat die Welt mehrere Teilaufgaben, kann die Nummer der aktuellen Teilaufgabe mit `welt.teilaufgabe()` abgefragt werden. Die Erste Aufgabe gibt `1` zurück, die zweite `2` und so weiter.

In dieser <a href="./?task=wiki_Welt_2" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Welt</a> soll in der ersten Teilaufgabe ein roter, in der zweiten ein grüner und in der dritten ein blauer Ziegel gelegt werden.



```RKBasic
Zahl aufgabe = welt.teilaufgabe()
wenn aufgabe == 1 dann
  k1.hinlegen(rot)
sonst wenn aufgabe == 2 dann
  k1.hinlegen(grün)
sonst
  k1.hinlegen(blau)
ende
```