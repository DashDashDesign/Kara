// Kara.exe: the shortcut target of the Windows installer.
// Starts the Kara server (portable Node, no console window), then opens Kara in its own Chrome window
// (app mode, no tabs). A second launch brings that window back instead of opening another one.
// When the window closes, the server it started stops. Without Chrome, it offers to install it.
// Built with the C# compiler that ships with Windows (.NET Framework 4), so C# 5 syntax only.
using System;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

static class Kara
{
    const string Url = "http://localhost:3210";
    const string Probe = "http://127.0.0.1:3210/api/config";
    const string ChromePage = "https://www.google.com/chrome/";

    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hWnd);

    static bool French { get { return System.Globalization.CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "fr"; } }

    [STAThread]
    static void Main()
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Kara");
        Directory.CreateDirectory(data);
        string log = Path.Combine(data, "server.log");
        string profile = Path.Combine(data, "browser-chrome");

        // Kara is already open: show its window instead of a second one.
        if (Up() && BringBack(profile)) return;

        string chrome = FindChrome();
        if (chrome == null)
        {
            string text = French
                ? "Kara s'ouvre dans Google Chrome, qui n'est pas installé sur cet ordinateur.\n\nOuvrir la page de téléchargement de Chrome ? Relancez Kara une fois Chrome installé."
                : "Kara opens in Google Chrome, which is not installed on this computer.\n\nOpen the Chrome download page? Start Kara again once Chrome is installed.";
            if (MessageBox.Show(text, "Kara", MessageBoxButtons.YesNo, MessageBoxIcon.Information) == DialogResult.Yes) Process.Start(ChromePage);
            return;
        }

        Process server = null;
        if (!Up())
        {
            server = StartServer(dir, log);
            if (server == null || !WaitUp(server, 30))
            {
                string text = French ? "Kara n'a pas pu démarrer. Les détails sont dans :\n" : "Kara could not start. Details are in:\n";
                MessageBox.Show(text + log, "Kara", MessageBoxButtons.OK, MessageBoxIcon.Error);
                if (server != null && !server.HasExited) server.Kill();
                return;
            }
        }

        // A profile of its own, with no sign-in, sync, extensions or translation offer.
        string args = "--app=" + Url + " --user-data-dir=\"" + profile + "\" --no-first-run --no-default-browser-check"
            + " --disable-sync --disable-extensions --disable-background-mode --disable-features=Translate"
            + " --lang=" + System.Globalization.CultureInfo.CurrentUICulture.Name + " --window-size=1440,900";
        Process.Start(new ProcessStartInfo(chrome, args) { UseShellExecute = false });

        // Only the launch that started the server stops it, once no Kara window is left: we watch the
        // windows of the Chrome processes that use Kara's own profile, then close them all.
        if (server == null) return;
        bool seen = false;
        int quiet = 0;
        bool restarted = false;
        for (int waited = 0; ; waited += 2)
        {
            Thread.Sleep(2000);
            // "Restart Kara" (after an update): the server starts a fresh copy of itself, then leaves.
            if (!restarted && server.HasExited)
            {
                if (!WaitFor(15)) break;
                restarted = true;
            }
            if (restarted && !Up() && !WaitFor(15)) break;
            if (KaraWindow(profile) != IntPtr.Zero) { seen = true; quiet = 0; continue; }
            if (!seen && waited < 60) continue;
            if (++quiet >= 2) break;
        }
        foreach (int id in ProfileProcesses(profile))
        {
            try { Process.GetProcessById(id).Kill(); } catch { }
        }
        if (!server.HasExited) server.Kill();
        // The copy started by a restart is not ours as a Process: find it by its folder.
        if (restarted) foreach (int id in ServerProcesses(dir))
        {
            try { Process.GetProcessById(id).Kill(); } catch { }
        }
    }

    // The Kara window, if one is open.
    static IntPtr KaraWindow(string profile)
    {
        foreach (int id in ProfileProcesses(profile))
        {
            try
            {
                IntPtr h = Process.GetProcessById(id).MainWindowHandle;
                if (h != IntPtr.Zero) return h;
            }
            catch (ArgumentException) { }
        }
        return IntPtr.Zero;
    }

    static bool BringBack(string profile)
    {
        IntPtr h = KaraWindow(profile);
        if (h == IntPtr.Zero) return false;
        if (IsIconic(h)) ShowWindow(h, 9); // SW_RESTORE
        SetForegroundWindow(h);
        return true;
    }

    static bool WaitFor(int seconds)
    {
        for (int i = 0; i < seconds * 4; i++)
        {
            if (Up()) return true;
            Thread.Sleep(250);
        }
        return false;
    }

    // Node processes running server.js from this app's folder.
    static int[] ServerProcesses(string dir)
    {
        var ids = new System.Collections.Generic.List<int>();
        using (var search = new ManagementObjectSearcher("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'node.exe'"))
        {
            foreach (ManagementObject p in search.Get())
            {
                string cmd = p["CommandLine"] as string;
                if (cmd != null && cmd.IndexOf(dir.TrimEnd('\\'), StringComparison.OrdinalIgnoreCase) >= 0 && cmd.IndexOf("server.js", StringComparison.OrdinalIgnoreCase) >= 0) ids.Add(Convert.ToInt32(p["ProcessId"]));
            }
        }
        return ids.ToArray();
    }

    // Ids of the Chrome processes started with Kara's profile folder.
    static int[] ProfileProcesses(string profile)
    {
        var ids = new System.Collections.Generic.List<int>();
        using (var search = new ManagementObjectSearcher("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'chrome.exe'"))
        {
            foreach (ManagementObject p in search.Get())
            {
                string cmd = p["CommandLine"] as string;
                if (cmd != null && cmd.IndexOf(profile, StringComparison.OrdinalIgnoreCase) >= 0) ids.Add(Convert.ToInt32(p["ProcessId"]));
            }
        }
        return ids.ToArray();
    }

    static Process StartServer(string dir, string log)
    {
        string node = Path.Combine(dir, "node", "node.exe");
        if (!File.Exists(node)) node = "node";
        var psi = new ProcessStartInfo(node, "server.js")
        {
            WorkingDirectory = dir,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        try
        {
            var writer = new StreamWriter(log, false) { AutoFlush = true };
            var p = new Process { StartInfo = psi };
            p.OutputDataReceived += (s, e) => { if (e.Data != null) lock (writer) writer.WriteLine(e.Data); };
            p.ErrorDataReceived += (s, e) => { if (e.Data != null) lock (writer) writer.WriteLine(e.Data); };
            p.Start();
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
            return p;
        }
        catch (Exception err)
        {
            File.AppendAllText(log, err.ToString());
            return null;
        }
    }

    static bool Up()
    {
        try
        {
            var req = (HttpWebRequest)WebRequest.Create(Probe);
            req.Timeout = 1500;
            req.Proxy = null;
            using (var res = (HttpWebResponse)req.GetResponse()) return (int)res.StatusCode == 200;
        }
        catch { return false; }
    }

    static bool WaitUp(Process server, int seconds)
    {
        for (int i = 0; i < seconds * 4; i++)
        {
            if (server.HasExited) return false;
            if (Up()) return true;
            Thread.Sleep(250);
        }
        return false;
    }

    static string FindChrome()
    {
        foreach (RegistryKey root in new[] { Registry.CurrentUser, Registry.LocalMachine })
        {
            using (RegistryKey key = root.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"))
            {
                string path = key == null ? null : key.GetValue(null) as string;
                if (!string.IsNullOrEmpty(path) && File.Exists(path.Trim('"'))) return path.Trim('"');
            }
        }
        string[] guesses = {
            @"%ProgramFiles%\Google\Chrome\Application\chrome.exe",
            @"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe",
            @"%LocalAppData%\Google\Chrome\Application\chrome.exe"
        };
        foreach (string g in guesses)
        {
            string path = Environment.ExpandEnvironmentVariables(g);
            if (File.Exists(path)) return path;
        }
        return null;
    }
}
