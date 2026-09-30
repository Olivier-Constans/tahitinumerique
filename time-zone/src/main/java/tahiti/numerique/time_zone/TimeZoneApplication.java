package tahiti.numerique.time_zone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.Clock;

@SpringBootApplication
public class TimeZoneApplication {

	static void main(String[] args) {
		SpringApplication.run(TimeZoneApplication.class, args);
	}

	@Bean
	Clock getClock() {
		return Clock.systemUTC();
	}

}
