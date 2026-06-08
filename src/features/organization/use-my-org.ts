"use client";

import { useEffect, useState } from "react";
import { getMyOrg } from "@/features/organization/api";
import { ApiError } from "@/types/api";
import type { OrganizationDto } from "@/types/organization";

interface MyOrgState {
  org: OrganizationDto | null;
  selfManaged: boolean;
  loading: boolean;
}

export function useMyOrg(): MyOrgState {
  const [state, setState] = useState<MyOrgState>({
    org: null,
    selfManaged: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    getMyOrg()
      .then((org) => {
        if (active) setState({ org, selfManaged: false, loading: false });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          org: null,
          selfManaged: err instanceof ApiError && err.code === 404,
          loading: false,
        });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
