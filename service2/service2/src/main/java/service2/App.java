package service2;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;


public class App {
    public static void main(String[] args) throws IOException {
        
        HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 3002), 0);
        server.start();
        System.out.println("Service2 Listening on port 3002");

    }
}
