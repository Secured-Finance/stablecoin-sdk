import React, { useCallback } from "react";
import { Box, Button, Card, Flex, Heading } from "theme-ui";
import { InfoMessage } from "../InfoMessage";
import { useTroveView } from "./context/TroveViewContext";

export const NoTrove: React.FC = () => {
  const { dispatchEvent } = useTroveView();

  const handleOpenTrove = useCallback(() => {
    dispatchEvent("OPEN_TROVE_PRESSED");
  }, [dispatchEvent]);

  return (
    <Card>
      <Heading>Trove</Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title="You haven't borrowed any USDFC yet.">
          You can borrow USDFC by opening a Trove.
        </InfoMessage>

        <Flex variant="layout.actions">
          <Button onClick={handleOpenTrove}>Open Trove</Button>
        </Flex>
      </Box>
    </Card>
  );
};
