package tahiti.numerique.time_zone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.time.Clock;
import java.util.Locale;

@SpringBootApplication
public class TimeZoneApplication {

	static void main(String[] args) {
		SpringApplication.run(TimeZoneApplication.class, args);
	}

	@Bean
	Clock getClock() {
		return Clock.systemDefaultZone();
	}

}
