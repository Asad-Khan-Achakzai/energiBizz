-- MySQL dump 10.13  Distrib 8.0.23, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: energibizz
-- ------------------------------------------------------
-- Server version	8.0.23-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ActiveSessionstbl`
--

DROP TABLE IF EXISTS `ActiveSessionstbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ActiveSessionstbl` (
  `ID` varchar(255) NOT NULL,
  `OwnerID` varchar(245) NOT NULL,
  `OwnerEmail` varchar(45) NOT NULL,
  `IsLocked` tinyint NOT NULL,
  `IsMuted` tinyint NOT NULL,
  `MediaServerID` varchar(255) NOT NULL,
  `MediaServerIPAddress` varchar(45) NOT NULL,
  `MediaServerSecret` varchar(45) NOT NULL,
  `PassCode` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID_UNIQUE` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ActiveSessionstbl`
--

LOCK TABLES `ActiveSessionstbl` WRITE;
/*!40000 ALTER TABLE `ActiveSessionstbl` DISABLE KEYS */;
INSERT INTO `ActiveSessionstbl` VALUES ('EnergiBizz_27kjBchT9','123','ali@gmail.com',0,0,'1','https://35.225.227.44','trillo123','123456'),('EnergiBizz_6RfjQtrr7v','123','asad.khan@zaxiss.com',0,0,'1','https://35.225.227.44','trillo123','1234564564'),('EnergiBizz_ALArCBRavE','123','asad.khan@zaxiss.com',0,0,'1','https://35.225.227.44','trillo123','1234564564'),('EnergiBizz_dbbctsZ3b','123','asad.khan@zaxiss.com',0,0,'1','https://35.225.227.44','trillo123','1234564564'),('EnergiBizz_TMN5KLHzX','123','ali@gmail.com',0,0,'1','https://35.225.227.44','trillo123','1234'),('EnergiBizz_VefL1Z97Z','123','ali@gmail.com',0,0,'1','https://35.225.227.44','trillo123','123456'),('EnergiBizz_YWca13YG9','123','ali@gmail.com',0,0,'1','https://35.225.227.44','trillo123','1234'),('EnergiBizz_ZF6cyj4CY','123','ali@gmail.com',0,0,'1','https://35.225.227.44','trillo123','123456');
/*!40000 ALTER TABLE `ActiveSessionstbl` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-02-15 22:44:52
