-- Kara.app for macOS: a stay-open applet that starts the Kara server (bundled Node),
-- opens Kara in its own window (Chrome or Edge in app mode, else the default browser),
-- and stops the server when Kara is quit (Cmd+Q or Quit in the Dock).
property started : false

on run
	set res to (POSIX path of (path to me)) & "Contents/Resources/"
	set logFile to (POSIX path of (path to library folder from user domain)) & "Logs/Kara.log"
	set pidFile to (POSIX path of (path to temporary items from user domain)) & "kara-server.pid"
	if not my serverUp() then
		do shell script "cd " & quoted form of (res & "app") & " && " & quoted form of (res & "node/bin/node") & " server.js > " & quoted form of logFile & " 2>&1 & echo $! > " & quoted form of pidFile
		set started to true
		repeat 120 times
			if my serverUp() then exit repeat
			delay 0.25
		end repeat
		if not my serverUp() then
			display alert "Kara could not start." message ("Details are in " & logFile) as critical
			quit
			return
		end if
	end if
	my openWindow()
end run

on reopen
	my openWindow()
end reopen

on quit
	if started then
		set pidFile to (POSIX path of (path to temporary items from user domain)) & "kara-server.pid"
		do shell script "kill $(cat " & quoted form of pidFile & ") 2>/dev/null; rm -f " & quoted form of pidFile & "; true"
	end if
	continue quit
end quit

on serverUp()
	try
		do shell script "curl -fsS -m 2 http://127.0.0.1:3210/api/config > /dev/null"
		return true
	on error
		return false
	end try
end serverUp

-- Kara opens in its own Google Chrome window (app mode, its own profile). Without Chrome, it offers to install it.
on openWindow()
	set profile to (POSIX path of (path to application support folder from user domain)) & "Kara/browser-chrome"
	set flags to " --args --app=http://localhost:3210 --user-data-dir=" & quoted form of profile & " --no-first-run --no-default-browser-check --disable-sync --disable-extensions --disable-features=Translate --window-size=1440,900"
	try
		do shell script "open -Ra 'Google Chrome'"
	on error
		set french to (user locale of (system info)) starts with "fr"
		if french then
			set msg to "Kara s'ouvre dans Google Chrome, qui n'est pas installé sur ce Mac. Ouvrir la page de téléchargement de Chrome ? Relancez Kara une fois Chrome installé."
			set okLabel to "Télécharger Chrome"
			set laterLabel to "Plus tard"
		else
			set msg to "Kara opens in Google Chrome, which is not installed on this Mac. Open the Chrome download page? Start Kara again once Chrome is installed."
			set okLabel to "Download Chrome"
			set laterLabel to "Later"
		end if
		set answer to button returned of (display dialog msg buttons {laterLabel, okLabel} default button okLabel with title "Kara")
		if answer is okLabel then open location "https://www.google.com/chrome/"
		quit
		return
	end try
	do shell script "open -na 'Google Chrome'" & flags
end openWindow
