package service2;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;


public class App {
    
    // Handle call to /
    static class InfoHandler implements HttpHandler {
        
        @Override
        public void handle(HttpExchange t) throws IOException {
            try {
                

                // Commands
                String reboot = runCommand("last reboot");
                String processes = runCommand("ps -ax");
                String disk = runCommand("df");
                String host = runCommand("hostname -I");

                //Damn JSON libraries crashed here without throwing, was very annoying
                // Setup JSON
                String json = "{";
                json += "\"host\":\"" + host + "\",";
                json += "\"processes\":\"" + processes + "\",";
                json += "\"disk\":\"" + disk + "\",";
                json += "\"reboot\":\"" + reboot + "\"";
                json += "}";

                // Setup response and send
                t.getResponseHeaders().set("Content-Type", "application/json");
                t.sendResponseHeaders(200, json.length());
                OutputStream os = t.getResponseBody();
                os.write(json.getBytes());
                os.flush();
                os.close();
                
            } catch (Exception e) {
                e.printStackTrace();
            }
            
        }
    }
    // Runs commands
    public static String runCommand(String command) throws Exception {
        ProcessBuilder processBuilder = new ProcessBuilder();

        processBuilder.command("sh", "-c", command);

        try {

            Process process = processBuilder.start();

            BufferedReader reader =
                new BufferedReader(new InputStreamReader(process.getInputStream()));

            String line;
            String output = "";
            while ((line = reader.readLine()) != null) {
                output = output + line;
            }
            return output;

        } catch (Exception e) {
            throw new Exception("Running command" + command  + "failed");
        }

    }

    public static void main(String[] args) throws IOException {
        
        // Start server
        HttpServer server = HttpServer.create(new InetSocketAddress(8200), 0);
        server.createContext("/", new InfoHandler());
        server.setExecutor(null);
        server.start();
        System.out.println("Service2 Listening on port 8200");

    }
}
