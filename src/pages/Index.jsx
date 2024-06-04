import React, { useState } from "react";
import { Container, VStack, HStack, Button, Text, Box, Table, Thead, Tbody, Tr, Th, Td, useToast } from "@chakra-ui/react";
import { FaNetworkWired, FaFileAlt, FaDatabase, FaEye, FaStop } from "react-icons/fa";

const INTERVAL_PING = 100;
const pingCount = 3;
const HOSTS = ["169.254.151.205"];
const PORT = 65432;
const SAVE_PATH = "/Users/francesco.bonforte/Desktop/cartella/";

const Index = () => {
  const [pingStatus, setPingStatus] = useState("");
  const [fileStatus, setFileStatus] = useState("");
  const [raspberryStatus, setRaspberryStatus] = useState("");
  const [dbStatus, setDbStatus] = useState("");
  const [statusFile, setStatusFile] = useState([]);
  const toast = useToast();

  const ping = async (host, pingCount) => {
    // Simulate ping logic
    setPingStatus("Successful Ping");
  };

  const checkFileInDirectory = (directory, filename) => {
    // Simulate file check logic
    setFileStatus("File presente");
  };

  const fileRequestRaspberry = async (hosts) => {
    // Simulate file request logic
    setRaspberryStatus("File ricevuto e salvato con successo");
    setStatusFile([["169.254.151.205", "Success"]]);
  };

  const dbUpdate = async () => {
    // Simulate DB update logic
    setDbStatus("Database updated successfully");
  };

  const showTable = () => {
    toast({
      title: "File Status",
      description: (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Host</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {statusFile.map((row, index) => (
              <Tr key={index}>
                <Td>{row[0]}</Td>
                <Td>{row[1]}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ),
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Container centerContent maxW="container.md" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <VStack spacing={4}>
        <HStack spacing={4}>
          <Button leftIcon={<FaNetworkWired />} colorScheme="teal" onClick={() => ping(HOSTS, pingCount)}>
            Esegui Ping
          </Button>
          <Box bg="white" border="1px" borderColor="black" p={2} minW="200px">
            <Text>{pingStatus}</Text>
          </Box>
        </HStack>
        <HStack spacing={4}>
          <Button leftIcon={<FaFileAlt />} colorScheme="teal" onClick={() => checkFileInDirectory(SAVE_PATH, "file_esterno.txt")}>
            Esegui Richiesta File Esterno
          </Button>
          <Box bg="white" border="1px" borderColor="black" p={2} minW="200px">
            <Text>{fileStatus}</Text>
          </Box>
        </HStack>
        <HStack spacing={4}>
          <Button leftIcon={<FaFileAlt />} colorScheme="teal" onClick={() => fileRequestRaspberry(HOSTS)}>
            Esegui Richiesta File Raspberry
          </Button>
          <Box bg="white" border="1px" borderColor="black" p={2} minW="200px">
            <Text>{raspberryStatus}</Text>
          </Box>
        </HStack>
        <HStack spacing={4}>
          <Button leftIcon={<FaDatabase />} colorScheme="teal" onClick={() => dbUpdate()}>
            Aggiorna Db
          </Button>
          <Box bg="white" border="1px" borderColor="black" p={2} minW="200px">
            <Text>{dbStatus}</Text>
          </Box>
        </HStack>
        <Button leftIcon={<FaEye />} colorScheme="teal" onClick={showTable}>
          Mostra stato file
        </Button>
        <Button leftIcon={<FaStop />} colorScheme="red" onClick={() => window.close()}>
          Exit
        </Button>
      </VStack>
    </Container>
  );
};

export default Index;
