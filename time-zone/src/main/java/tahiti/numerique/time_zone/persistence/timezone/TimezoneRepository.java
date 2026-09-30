package tahiti.numerique.time_zone.persistence.timezone;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimezoneRepository extends JpaRepository<Timezone, Long> {

    List<Timezone> findAllByIdNot(Long id);
}