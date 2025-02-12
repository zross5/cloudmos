import React, { Dispatch, useEffect, useRef, useState } from "react";
import { defaultService } from "@src/utils/sdl/data";
import { useFieldArray, useForm } from "react-hook-form";
import { SdlBuilderFormValues, Service } from "@src/types";
import { nanoid } from "nanoid";
import { generateSdl } from "@src/utils/sdl/sdlGenerator";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { SimpleServiceFormControl } from "../sdl/SimpleServiceFormControl";
import { useProviderAttributesSchema } from "@src/queries/useProvidersQuery";
import { importSimpleSdl } from "@src/utils/sdl/sdlImport";
import { Subscription } from "react-hook-form/dist/utils/createSubject";

interface Props {
  sdlString: string;
  setEditedManifest: Dispatch<string>;
}

export type SdlBuilderRefType = {
  getSdl: () => string;
};

export const SdlBuilder = React.forwardRef<SdlBuilderRefType, Props>(({ sdlString, setEditedManifest }, ref) => {
  const [error, setError] = useState(null);
  const formRef = useRef<HTMLFormElement>();
  const [isInit, setIsInit] = useState(false);
  const { control, trigger, watch, setValue } = useForm<SdlBuilderFormValues>({
    defaultValues: {
      services: [{ ...defaultService }]
    }
  });
  const {
    fields: services,
    remove: removeService,
    append: appendService
  } = useFieldArray({
    control,
    name: "services",
    keyName: "id"
  });
  const { services: _services } = watch();
  const { data: providerAttributesSchema } = useProviderAttributesSchema();
  const [serviceCollapsed, setServiceCollapsed] = useState([]);

  React.useImperativeHandle(ref, () => ({
    getSdl: getSdl
  }));

  useEffect(() => {
    const { unsubscribe } = watch(data => {
      const sdl = generateSdl({ services: data.services as Service[] });
      setEditedManifest(sdl);
    });

    try {
      const services = createAndValidateSdl(sdlString);
      setValue("services", services as Service[]);
    } catch (error) {
      setError("Error importing SDL");
    }

    setIsInit(true);

    return () => {
      unsubscribe();
    };
  }, [watch]);

  const getSdl = () => {
    return generateSdl({ services: _services });
  };

  const createAndValidateSdl = (yamlStr: string) => {
    try {
      if (!yamlStr) return [];

      const services = importSimpleSdl(yamlStr, providerAttributesSchema);

      setError(null);

      return services;
    } catch (err) {
      if (err.name === "YAMLException" || err.name === "CustomValidationError") {
        setError(err.message);
      } else if (err.name === "TemplateValidation") {
        setError(err.message);
      } else {
        setError("Error while parsing SDL file");
        // setParsingError(err.message);
        console.error(err);
      }
    }
  };

  const onAddService = () => {
    appendService({ ...defaultService, id: nanoid(), title: `service-${services.length + 1}` });
  };

  const onRemoveService = (index: number) => {
    removeService(index);
  };

  return (
    <Box sx={{ paddingBottom: "2rem" }}>
      {!isInit ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <CircularProgress size="3rem" color="secondary" />
        </Box>
      ) : (
        <form ref={formRef} autoComplete="off">
          {services.map((service, serviceIndex) => (
            <SimpleServiceFormControl
              key={service.id}
              service={service}
              serviceIndex={serviceIndex}
              _services={_services}
              providerAttributesSchema={providerAttributesSchema}
              control={control}
              trigger={trigger}
              onRemoveService={onRemoveService}
              serviceCollapsed={serviceCollapsed}
              setServiceCollapsed={setServiceCollapsed}
            />
          ))}

          {error && (
            <Alert severity="error" variant="outlined" sx={{ marginTop: "1rem" }}>
              {error}
            </Alert>
          )}

          <Box sx={{ paddingTop: "1rem", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div>
              <Button color="secondary" variant="contained" size="small" onClick={onAddService}>
                Add Service
              </Button>
            </div>
          </Box>
        </form>
      )}
    </Box>
  );
});
